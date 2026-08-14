import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { formatMongoSong, updateActiveSongs, type Song } from '@/data/music';

type PlayerContextValue = {
  songs: Song[]; currentSong: Song; currentIndex: number; isPlaying: boolean; progress: number; duration: number; volume: number; isMuted: boolean; shuffle: boolean; repeat: boolean; favorites: string[];
  queue: Song[]; playSong: (song: Song, queue?: Song[]) => void; togglePlay: () => void; next: () => void; previous: () => void; seek: (value: number) => void; toggleFavorite: (songId: string) => void; toggleMute: () => void; setVolume: (value: number) => void; setShuffle: () => void; setRepeat: () => void; refreshSongs: () => Promise<void>;
};
const PlayerContext = createContext<PlayerContextValue | null>(null);
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || (Platform.OS === 'web' ? 'http://localhost:5000' : 'https://music-app-83f1.onrender.com');
const API_URL = API_BASE_URL.endsWith('/api/songs') ? API_BASE_URL : API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/songs` : `${API_BASE_URL}/api/songs`;
const EMPTY_SONG: Song = { id: '__empty__', title: 'No songs uploaded yet', artist: 'Upload a song from the dashboard', album: 'Your music library', year: '', duration: '00:00', seconds: 0, cover: require('../assets/images/icon.png'), genre: '' };
const metadataFor = (song: Song) => ({ title: song.title, artist: song.artist, albumTitle: song.album, artworkUrl: typeof song.cover === 'object' && 'uri' in song.cover ? song.cover.uri : undefined });

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.72);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState(false); // repeat-one, no implicit repeat-all
  const [favorites, setFavorites] = useState<string[]>([]);
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const playerRef = useRef<AudioPlayer | null>(null);
  const songsRef = useRef<Song[]>([]), indexRef = useRef(0), queueIdsRef = useRef<string[]>([]), shuffleRef = useRef(false), repeatRef = useRef(false), volumeRef = useRef(0.72), mutedRef = useRef(false), completionHandledRef = useRef(false), selectedSongIdRef = useRef<string | null>(null);
  const currentSong = songsList[currentIndex] ?? songsList[0] ?? EMPTY_SONG;

  useEffect(() => { songsRef.current = songsList; }, [songsList]);
  useEffect(() => { queueIdsRef.current = queueIds; }, [queueIds]);
  useEffect(() => { indexRef.current = currentIndex; selectedSongIdRef.current = currentSong.id === EMPTY_SONG.id ? null : currentSong.id; }, [currentIndex, currentSong.id]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);

  const chooseNextIndex = useCallback((from: number) => {
    const list = songsRef.current;
    const ids = queueIdsRef.current.length ? queueIdsRef.current : list.map((song) => song.id);
    if (ids.length < 2) return -1;
    const currentId = list[from]?.id;
    const currentQueueIndex = ids.indexOf(currentId);
    if (shuffleRef.current) {
      const candidates = ids.filter((id) => id !== currentId);
      const nextId = candidates[Math.floor(Math.random() * candidates.length)];
      return list.findIndex((song) => song.id === nextId);
    }
    const nextId = ids[(currentQueueIndex + 1 + ids.length) % ids.length];
    return list.findIndex((song) => song.id === nextId);
  }, []);
  const loadAndPlay = useCallback((index: number, shouldPlay = true) => {
    const song = songsRef.current[index], player = playerRef.current;
    if (!song?.audioUrl || !player) return;
    completionHandledRef.current = false; indexRef.current = index; selectedSongIdRef.current = song.id; setCurrentIndex(index); setProgress(0);
    player.pause(); player.replace({ uri: song.audioUrl }); player.volume = mutedRef.current ? 0 : volumeRef.current;
    player.setActiveForLockScreen(true, metadataFor(song));
    if (shouldPlay) { player.play(); setIsPlaying(true); }
  }, []);
  const handleFinished = useCallback(() => {
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    const player = playerRef.current; if (!player) return;
    if (repeatRef.current) { player.seekTo(0).then(() => player.play()).catch(() => setIsPlaying(false)); setProgress(0); setIsPlaying(true); return; }
    const nextIndex = chooseNextIndex(indexRef.current);
    if (nextIndex >= 0) { loadAndPlay(nextIndex); return; }
    player.pause(); player.seekTo(0).catch(() => {}); setProgress(0); setIsPlaying(false);
  }, [chooseNextIndex, loadAndPlay]);
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
    const player = createAudioPlayer(null, { updateInterval: 250, keepAudioSessionActive: true }); playerRef.current = player;
    const subscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
      const duration = status.duration || 0;
      setDuration(duration);
      setProgress(duration ? Math.max(0, Math.min(100, status.currentTime / duration * 100)) : 0);
      setIsPlaying(status.playing);
      if (status.playing) completionHandledRef.current = false;
      if (status.didJustFinish) handleFinished();
    });
    return () => { subscription.remove(); player.clearLockScreenControls(); player.remove(); playerRef.current = null; };
  }, [handleFinished]);
  const refreshSongs = useCallback(async () => {
    try {
      const response = await fetch(API_URL); if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data: unknown = await response.json(); if (!Array.isArray(data)) throw new Error('Invalid songs response');
      const formatted = data.map(formatMongoSong), selectedId = selectedSongIdRef.current, retained = selectedId ? formatted.findIndex((song) => song.id === selectedId) : -1;
      setSongsList(formatted); updateActiveSongs(formatted);
      if (retained >= 0) { indexRef.current = retained; setCurrentIndex(retained); }
      else if (formatted.length) { indexRef.current = 0; selectedSongIdRef.current = formatted[0].id; playerRef.current?.pause(); setIsPlaying(false); setProgress(0); setCurrentIndex(0); }
      else { playerRef.current?.pause(); setIsPlaying(false); setProgress(0); }
    } catch (error) { console.warn('Could not refresh PlayTune songs', error); }
  }, []);
  useEffect(() => {
    refreshSongs();
    const refreshTimer = setInterval(refreshSongs, 15000);
    return () => clearInterval(refreshTimer);
  }, [refreshSongs]);
  useEffect(() => { AsyncStorage.getItem('90s-music-favorites').then((stored) => stored && setFavorites(JSON.parse(stored) as string[])).catch(() => {}); }, []);
  const playSong = useCallback((song: Song, sourceQueue?: Song[]) => {
    if (sourceQueue?.length) {
      const ids = sourceQueue.map((item) => item.id);
      queueIdsRef.current = ids;
      setQueueIds(ids);
    }
    const index = songsRef.current.findIndex((item) => item.id === song.id), player = playerRef.current;
    if (index < 0) return;
    if (index === indexRef.current && player?.isLoaded) { if (player.duration > 0 && player.currentTime >= player.duration) player.seekTo(0).catch(() => {}); player.play(); setIsPlaying(true); return; }
    loadAndPlay(index);
  }, [loadAndPlay]);
  const togglePlay = useCallback(() => {
    const player = playerRef.current; if (!player || !songsRef.current.length) return;
    if (!player.isLoaded || !selectedSongIdRef.current) { loadAndPlay(indexRef.current); return; }
    if (player.playing) { player.pause(); setIsPlaying(false); return; }
    if (player.duration > 0 && player.currentTime >= player.duration) player.seekTo(0).catch(() => {});
    player.play(); setIsPlaying(true);
  }, []);
  const next = useCallback(() => { const nextIndex = chooseNextIndex(indexRef.current); if (nextIndex >= 0) loadAndPlay(nextIndex); }, [chooseNextIndex, loadAndPlay]);
  const previous = useCallback(() => {
    const player = playerRef.current, index = indexRef.current, list = songsRef.current;
    if (!player || !list.length) return;
    if (player.currentTime > 3) { player.seekTo(0).then(() => player.play()).catch(() => {}); setProgress(0); setIsPlaying(true); return; }
    const ids = queueIdsRef.current.length ? queueIdsRef.current : list.map((song) => song.id);
    const position = ids.indexOf(list[index]?.id);
    const previousId = ids[(position - 1 + ids.length) % ids.length];
    const previousIndex = list.findIndex((song) => song.id === previousId);
    if (previousIndex >= 0) loadAndPlay(previousIndex);
  }, [loadAndPlay]);
  const seek = useCallback((value: number) => { const safe = Math.max(0, Math.min(100, value)), player = playerRef.current; setProgress(safe); if (player?.duration) player.seekTo(safe / 100 * player.duration).catch(() => {}); }, []);
  const toggleFavorite = useCallback((songId: string) => setFavorites((items) => { const updated = items.includes(songId) ? items.filter((id) => id !== songId) : [...items, songId]; AsyncStorage.setItem('90s-music-favorites', JSON.stringify(updated)).catch(() => Alert.alert('Could not save favorite', 'Please try again.')); return updated; }), []);
  const setVolume = useCallback((value: number) => { const safe = Math.max(0, Math.min(1, value)); setVolumeState(safe); volumeRef.current = safe; if (safe > 0) { setIsMuted(false); mutedRef.current = false; } if (playerRef.current) playerRef.current.volume = safe; }, []);
  const toggleMute = useCallback(() => { const muted = !mutedRef.current; mutedRef.current = muted; setIsMuted(muted); if (playerRef.current) playerRef.current.volume = muted ? 0 : volumeRef.current; }, []);
  const queue = useMemo(() => {
    const ids = queueIds.length ? queueIds : songsList.map((song) => song.id);
    return ids.map((id) => songsList.find((song) => song.id === id)).filter((song): song is Song => Boolean(song));
  }, [queueIds, songsList]);
  const value = useMemo(() => ({ songs: songsList, queue, currentSong, currentIndex, isPlaying, progress, duration, volume: isMuted ? 0 : volume, isMuted, shuffle, repeat, favorites, playSong, togglePlay, next, previous, seek, toggleFavorite, toggleMute, setVolume, setShuffle: () => setShuffleState((active) => !active), setRepeat: () => setRepeatState((active) => !active), refreshSongs }), [songsList, queue, currentSong, currentIndex, isPlaying, progress, duration, volume, isMuted, shuffle, repeat, favorites, playSong, togglePlay, next, previous, seek, toggleFavorite, toggleMute, setVolume, refreshSongs]);
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
export function usePlayer() { const context = useContext(PlayerContext); if (!context) throw new Error('usePlayer must be used within PlayerProvider'); return context; }

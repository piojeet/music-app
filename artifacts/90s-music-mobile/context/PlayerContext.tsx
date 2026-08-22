import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer, { Event, PlaybackState, RepeatMode, useProgress, useIsPlaying, useActiveMediaItem } from '@rntp/player';
import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { formatMongoSong, updateActiveSongs, type Song } from '@/data/music';
import { setupTrackPlayer, songToTrack } from '@/lib/trackPlayer';

type PlayerContextValue = {
  songs: Song[]; currentSong: Song; currentIndex: number; isPlaying: boolean; progress: number; duration: number; volume: number; isMuted: boolean; shuffle: boolean; repeat: boolean; favorites: string[];
  queue: Song[]; playSong: (song: Song, queue?: Song[]) => void; togglePlay: () => void; next: () => void; previous: () => void; seek: (value: number) => void; toggleFavorite: (songId: string) => void; toggleMute: () => void; setVolume: (value: number) => void; setShuffle: () => void; setRepeat: () => void; refreshSongs: () => Promise<void>;
};
const PlayerContext = createContext<PlayerContextValue | null>(null);
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || (Platform.OS === 'web' ? 'http://localhost:5000' : 'https://music-app-83f1.onrender.com');
const API_URL = API_BASE_URL.endsWith('/api/songs') ? API_BASE_URL : API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/songs` : `${API_BASE_URL}/api/songs`;
const EMPTY_SONG: Song = { id: '__empty__', title: 'No songs uploaded yet', artist: 'Upload a song from the dashboard', album: 'Your music library', year: '', duration: '00:00', seconds: 0, cover: require('../assets/images/icon.png'), genre: '' };

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState(false);
  const [volumeState, setVolumeState] = useState(0.72);
  const [isMuted, setIsMuted] = useState(false);

  const songsRef = useRef<Song[]>([]);
  const queueIdsRef = useRef<string[]>([]);
  const shuffleRef = useRef(false);
  const repeatRef = useRef(false);
  const volumeRef = useRef(0.72);
  const mutedRef = useRef(false);

  // TrackPlayer hooks
  const { position, duration: trackDuration } = useProgress(250);
  const isPlaying = useIsPlaying();
  const activeMediaItem = useActiveMediaItem();

  const currentSong = useMemo(() => {
    if (!activeMediaItem) return songsList[0] ?? EMPTY_SONG;
    return songsList.find((s) => s.id === activeMediaItem.mediaId) ?? songsList[0] ?? EMPTY_SONG;
  }, [activeMediaItem, songsList]);

  const currentIndex = useMemo(() => {
    if (!activeMediaItem) return 0;
    return songsList.findIndex((s) => s.id === activeMediaItem.mediaId);
  }, [activeMediaItem, songsList]);

  const duration = trackDuration || currentSong.seconds || 0;
  const progress = duration > 0 ? Math.max(0, Math.min(100, (position / duration) * 100)) : 0;
  const volume = isMuted ? 0 : volumeState;

  useEffect(() => { songsRef.current = songsList; }, [songsList]);
  useEffect(() => { queueIdsRef.current = queueIds; }, [queueIds]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { volumeRef.current = volumeState; }, [volumeState]);
  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);

  // Keep volume in sync with TrackPlayer
  useEffect(() => {
    TrackPlayer.setVolume(mutedRef.current ? 0 : volumeRef.current);
  }, []);

  // Set up TrackPlayer on mount
  useEffect(() => {
    setupTrackPlayer();

    // Listen for remote commands (lock screen / notification)
    const subs = [
      TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play()),
      TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause()),
      TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext()),
      TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious()),
      TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position)),
    ];

    return () => { subs.forEach((s) => s.remove()); };
  }, []);

  // Handle repeat mode changes
  useEffect(() => {
    TrackPlayer.setRepeatMode(repeat ? RepeatMode.One : RepeatMode.Off);
  }, [repeat]);

  // Handle shuffle changes
  useEffect(() => {
    TrackPlayer.setShuffleEnabled(shuffle);
  }, [shuffle]);

  const refreshSongs = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid songs response');
      const formatted = data.map(formatMongoSong);
      const currentId = activeMediaItem?.mediaId;
      setSongsList(formatted);
      updateActiveSongs(formatted);
      songsRef.current = formatted;

      // If the currently playing song still exists, keep it. Otherwise reset.
      if (!currentId || !formatted.some((s) => s.id === currentId)) {
        if (formatted.length) {
          TrackPlayer.clear();
          const tracks = formatted.map(songToTrack);
          TrackPlayer.addMediaItems(tracks);
        } else {
          TrackPlayer.clear();
        }
      }
    } catch (error) {
      console.warn('Could not refresh PlayTune songs', error);
    }
  }, [activeMediaItem?.mediaId]);

  useEffect(() => {
    refreshSongs();
    const refreshTimer = setInterval(refreshSongs, 15000);
    return () => clearInterval(refreshTimer);
  }, [refreshSongs]);

  useEffect(() => {
    AsyncStorage.getItem('90s-music-favorites')
      .then((stored) => stored && setFavorites(JSON.parse(stored) as string[]))
      .catch(() => {});
  }, []);

  const playSong = useCallback(async (song: Song, sourceQueue?: Song[]) => {
    try {
      const list = songsRef.current;
      const trackIndex = list.findIndex((s) => s.id === song.id);
      if (trackIndex < 0 || !song.audioUrl) return;

      // Set up queue from source queue or all songs
      const tracks = sourceQueue
        ? sourceQueue.map(songToTrack)
        : list.map(songToTrack);

      const playIndex = sourceQueue
        ? sourceQueue.findIndex((s) => s.id === song.id)
        : trackIndex;

      if (sourceQueue?.length) {
        const ids = sourceQueue.map((s) => s.id);
        queueIdsRef.current = ids;
        setQueueIds(ids);
      }

      TrackPlayer.clear();
      TrackPlayer.addMediaItems(tracks);
      TrackPlayer.skipToIndex(playIndex >= 0 ? playIndex : 0);
      TrackPlayer.play();
    } catch (error) {
      console.warn('Could not play song', error);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const queue = TrackPlayer.getQueue();
    if (!queue.length) {
      // No queue, play the first song
      if (songsRef.current.length) {
        await playSong(songsRef.current[0]);
      }
      return;
    }
    if (isPlaying) {
      TrackPlayer.pause();
    } else {
      const state = TrackPlayer.getPlaybackState();
      if (state === PlaybackState.Ended || state === PlaybackState.Idle) {
        TrackPlayer.seekTo(0);
      }
      TrackPlayer.play();
    }
  }, [isPlaying, playSong]);

  const next = useCallback(() => {
    TrackPlayer.skipToNext();
  }, []);

  const previous = useCallback(() => {
    if (position > 3) {
      TrackPlayer.seekTo(0);
    } else {
      TrackPlayer.skipToPrevious();
    }
  }, [position]);

  const seek = useCallback((value: number) => {
    const safe = Math.max(0, Math.min(100, value));
    if (duration > 0) {
      TrackPlayer.seekTo((safe / 100) * duration);
    }
  }, [duration]);

  const toggleFavorite = useCallback((songId: string) => {
    setFavorites((items) => {
      const updated = items.includes(songId)
        ? items.filter((id) => id !== songId)
        : [...items, songId];
      AsyncStorage.setItem('90s-music-favorites', JSON.stringify(updated)).catch(() =>
        Alert.alert('Could not save favorite', 'Please try again.')
      );
      return updated;
    });
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !mutedRef.current;
    mutedRef.current = newMuted;
    setIsMuted(newMuted);
    TrackPlayer.setVolume(newMuted ? 0 : volumeRef.current);
  }, []);

  const setVolumeFn = useCallback((value: number) => {
    const safe = Math.max(0, Math.min(1, value));
    setVolumeState(safe);
    volumeRef.current = safe;
    if (safe > 0) {
      setIsMuted(false);
      mutedRef.current = false;
    }
    TrackPlayer.setVolume(safe);
  }, []);

  const queue = useMemo(() => {
    const ids = queueIds.length ? queueIds : songsList.map((song) => song.id);
    return ids
      .map((id) => songsList.find((song) => song.id === id))
      .filter((song): song is Song => Boolean(song));
  }, [queueIds, songsList]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      songs: songsList,
      queue,
      currentSong,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      isMuted,
      shuffle,
      repeat,
      favorites,
      playSong,
      togglePlay,
      next,
      previous,
      seek,
      toggleFavorite,
      toggleMute,
      setVolume: setVolumeFn,
      setShuffle: () => setShuffleState((active) => !active),
      setRepeat: () => setRepeatState((active) => !active),
      refreshSongs,
    }),
    [
      songsList, queue, currentSong, currentIndex, isPlaying, progress, duration,
      volume, isMuted, shuffle, repeat, favorites, playSong, togglePlay, next,
      previous, seek, toggleFavorite, toggleMute, setVolumeFn, refreshSongs,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}

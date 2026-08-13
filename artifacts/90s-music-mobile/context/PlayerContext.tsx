import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import Constants from 'expo-constants';
import { formatMongoSong, updateActiveSongs, Song } from '@/data/music';

type PlayerContextValue = {
  songs: Song[];
  currentSong: Song;
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: boolean;
  favorites: string[];
  playSong: (song: Song) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (value: number) => void;
  toggleFavorite: (songId: string) => void;
  toggleMute: () => void;
  setVolume: (value: number) => void;
  setShuffle: () => void;
  setRepeat: () => void;
  refreshSongs: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const deploymentDomain = process.env.EXPO_PUBLIC_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const runtimeHost = Constants.expoConfig?.hostUri
  ?.replace(/^https?:\/\//, '')
  .split('/')[0]
  .replace(/:\d+$/, '');
// `localhost` inside an Expo app points to the phone/emulator, not the API server.
// Replit supplies EXPO_PUBLIC_DOMAIN for both development and deployed builds.
const API_URL = configuredApiUrl
  ? (configuredApiUrl.endsWith('/api/songs')
      ? configuredApiUrl
      : configuredApiUrl.endsWith('/api')
        ? `${configuredApiUrl}/songs`
        : `${configuredApiUrl}/api/songs`)
  : deploymentDomain
    ? `https://${deploymentDomain}/api/songs`
    : runtimeHost
      ? `http://${runtimeHost}:5000/api/songs`
      : Platform.OS === 'web'
        ? 'http://localhost:5000/api/songs'
        : Platform.OS === 'android'
          ? 'http://10.0.2.2:5000/api/songs'
          : undefined;

const EMPTY_SONG: Song = {
  id: '__empty__',
  title: 'No songs uploaded yet',
  artist: 'Upload a song from the dashboard',
  album: 'Your music library',
  year: '',
  duration: '00:00',
  seconds: 0,
  cover: require('../assets/images/icon.png'),
  genre: '',
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.72);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentSongIdRef = useRef(EMPTY_SONG.id);

  const fetchSongsFromApi = async () => {
    if (!API_URL) return;

    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const formatted = data.map(formatMongoSong);
        setSongsList(formatted);
        updateActiveSongs(formatted);
        const currentIndex = formatted.findIndex((song) => song.id === currentSongIdRef.current);
        setCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    } catch (_err) {
      // Keep the last successfully loaded user library while offline.
    }
  };

  useEffect(() => {
    fetchSongsFromApi();
    const interval = setInterval(fetchSongsFromApi, 8000);

    // Enable background audio mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('90s-music-favorites').then((stored) => {
      if (stored) setFavorites(JSON.parse(stored) as string[]);
    });
  }, []);

  const activeSongs = songsList;
  const currentSong = activeSongs[currentIndex] ?? activeSongs[0] ?? EMPTY_SONG;
  currentSongIdRef.current = currentSong.id;

  // Load and play actual audio when currentSong or isPlaying state changes
  useEffect(() => {
    let isCancelled = false;

    async function loadAudio() {
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (_e) {}
        soundRef.current = null;
      }

      if (!currentSong.audioUrl) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: currentSong.audioUrl },
          { shouldPlay: isPlaying, volume: isMuted ? 0 : volume },
          onPlaybackStatusUpdate
        );

        if (isCancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
      } catch (_err) {
        // Fallback for audio loading issues
      }
    }

    loadAudio();

    return () => {
      isCancelled = true;
    };
  }, [currentSong.id]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.durationMillis && status.durationMillis > 0) {
      const pct = (status.positionMillis / status.durationMillis) * 100;
      setProgress(pct);
    }

    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      if (repeat) {
        soundRef.current?.replayAsync();
      } else {
        next();
      }
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) {
      setIsPlaying((p) => !p);
      return;
    }

    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (_e) {
      setIsPlaying((p) => !p);
    }
  };

  const seek = async (value: number) => {
    setProgress(value);
    if (!soundRef.current) return;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        const positionMillis = (value / 100) * status.durationMillis;
        await soundRef.current.setPositionAsync(positionMillis);
      }
    } catch (_e) {}
  };

  const next = () => {
    if (activeSongs.length === 0) return;
    setCurrentIndex((index) => {
      if (shuffle) return Math.floor(Math.random() * activeSongs.length);
      return index === activeSongs.length - 1 ? (repeat ? 0 : index) : index + 1;
    });
    setProgress(0);
    setIsPlaying(true);
  };

  const previous = () => {
    if (activeSongs.length === 0) return;
    setCurrentIndex((index) => (index === 0 ? activeSongs.length - 1 : index - 1));
    setProgress(0);
    setIsPlaying(true);
  };

  const playSong = (song: Song) => {
    const index = activeSongs.findIndex((item) => item.id === song.id);
    if (index >= 0) {
      setCurrentIndex(index);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const toggleFavorite = (songId: string) => {
    setFavorites((current) => {
      const nextFavorites = current.includes(songId)
        ? current.filter((id) => id !== songId)
        : [...current, songId];
      AsyncStorage.setItem('90s-music-favorites', JSON.stringify(nextFavorites)).catch(() =>
        Alert.alert('Could not save favorite', 'Please try again.')
      );
      return nextFavorites;
    });
  };

  const setVolume = async (value: number) => {
    setVolumeState(value);
    if (value > 0) setIsMuted(false);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(value);
      } catch (_e) {}
    }
  };

  const toggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(nextMuted ? 0 : volume);
      } catch (_e) {}
    }
  };

  const value = useMemo(
    () => ({
      songs: activeSongs,
      currentSong,
      currentIndex,
      isPlaying,
      progress,
      volume: isMuted ? 0 : volume,
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
      setVolume,
      setShuffle: () => setShuffleState((value) => !value),
      setRepeat: () => setRepeatState((value) => !value),
      refreshSongs: fetchSongsFromApi,
    }),
    [activeSongs, currentSong, currentIndex, isPlaying, progress, volume, isMuted, shuffle, repeat, favorites]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}

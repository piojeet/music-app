import type { ImageSourcePropType } from 'react-native';

export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  duration: string;
  seconds: number;
  cover: ImageSourcePropType | { uri: string };
  audioUrl?: string;
  genre: string;
};

export function formatMongoSong(s: any): Song {
  const seconds = typeof s.duration === 'number' && s.duration > 0 ? s.duration : 180;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const fallbackCover = require('../assets/images/icon.png');
  let coverProp: ImageSourcePropType | { uri: string } = fallbackCover;
  if (s.coverImage && typeof s.coverImage === 'string') {
    coverProp = { uri: s.coverImage };
  } else if (s.cover) {
    coverProp = typeof s.cover === 'string' ? { uri: s.cover } : s.cover;
  }

  return {
    id: s.id || s._id || String(Math.random()),
    title: s.title || 'Untitled Track',
    artist: s.artist || 'Unknown Artist',
    album: s.album || '90s Classics',
    year: String(s.year || '1995'),
    duration: durationStr,
    seconds: seconds,
    cover: coverProp,
    audioUrl: s.audioUrl,
    genre: s.genre || '90s Hits',
  };
}

export let songs: Song[] = [];

export function updateActiveSongs(newSongs: Song[]) {
  songs.length = 0;
  songs.push(...newSongs);
}

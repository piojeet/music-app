import TrackPlayer, { PlayerCommand } from '@rntp/player';
import type { Song } from '@/data/music';

// setupPlayer() is SYNC and throws if called twice — guard with a simple boolean
let isSetup = false;

export function setupTrackPlayer() {
  if (isSetup) return;
  isSetup = true;

  // setupPlayer is synchronous — do NOT await it
  TrackPlayer.setupPlayer({
    android: {
      notification: {
        channelId: 'playtune-playback',
        channelName: 'PlayTune Playback',
        smallIcon: 'ic_music_note',
      },
      taskRemovedBehavior: 'continue',
    },
    handleAudioBecomingNoisy: true,
  });

  // Enable lock screen / notification controls
  TrackPlayer.setCommands({
    capabilities: [
      PlayerCommand.PlayPause,
      PlayerCommand.Next,
      PlayerCommand.Previous,
      PlayerCommand.Seek,
      PlayerCommand.Stop,
    ],
    handling: 'native',
    forwardInterval: 15,
    backwardInterval: 15,
  });
}

export function songToTrack(song: Song) {
  const artwork =
    typeof song.cover === 'object' && 'uri' in song.cover
      ? song.cover.uri
      : undefined;

  return {
    mediaId: song.id,
    url: song.audioUrl || '',
    title: song.title,
    artist: song.artist,
    albumTitle: song.album,
    artworkUrl: artwork,
    duration: song.seconds || 0,
  };
}

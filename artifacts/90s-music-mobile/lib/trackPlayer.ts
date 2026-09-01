import TrackPlayer, { PlayerCommand } from '@rntp/player';
import type { Song } from '@/data/music';

let isSetup = false;

export async function setupTrackPlayer() {
  if (isSetup) return;
  await TrackPlayer.setupPlayer({
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

  // Enable lock screen / notification controls with next, previous, play/pause, seek
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

  isSetup = true;
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

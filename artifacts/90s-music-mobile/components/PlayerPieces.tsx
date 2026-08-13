import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Song } from '@/data/music';
import { usePlayer } from '@/context/PlayerContext';

export function CoverArt({ source, size, radius = 14 }: { source: ImageSourcePropType; size: number; radius?: number }) {
  return <Image source={source} style={{ width: size, height: size, borderRadius: radius }} />;
}

export function PlayButton({ small = false }: { small?: boolean }) {
  const colors = useColors();
  const { isPlaying, togglePlay } = usePlayer();
  const size = small ? 40 : 68;
  return (
    <Pressable
      accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
      onPress={togglePlay}
      style={({ pressed }) => [styles.playButton, { width: size, height: size, backgroundColor: colors.rose }, pressed && styles.pressed]}
    >
      <Feather name={isPlaying ? 'pause' : 'play'} size={small ? 17 : 26} color={colors.primaryForeground} fill={isPlaying ? colors.primaryForeground : undefined} />
    </Pressable>
  );
}

export function SongRow({ song, index, compact = false }: { song: Song; index: number; compact?: boolean }) {
  const colors = useColors();
  const { currentSong, isPlaying, playSong, favorites, toggleFavorite } = usePlayer();
  const active = currentSong.id === song.id;
  return (
    <Pressable
      testID={`song-${song.id}`}
      onPress={() => playSong(song)}
      style={({ pressed }) => [
        styles.songRow,
        compact && styles.songRowCompact,
        { borderColor: active ? colors.rose : colors.border, backgroundColor: active ? 'rgba(104, 33, 38, 0.28)' : colors.glass },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.index, { color: active ? colors.rose : colors.mutedForeground }]}>{String(index + 1).padStart(2, '0')}</Text>
      <CoverArt source={song.cover} size={compact ? 48 : 54} radius={10} />
      <View style={styles.songCopy}>
        <Text numberOfLines={1} style={[styles.songTitle, { color: colors.foreground }]}>{song.title}</Text>
        <Text numberOfLines={1} style={[styles.songArtist, { color: colors.mutedForeground }]}>{song.artist}</Text>
      </View>
      {active && isPlaying ? (
        <View style={styles.equalizer}>
          <View style={[styles.eqBar, { backgroundColor: colors.rose, height: 9 }]} />
          <View style={[styles.eqBar, { backgroundColor: colors.rose, height: 16 }]} />
          <View style={[styles.eqBar, { backgroundColor: colors.rose, height: 12 }]} />
        </View>
      ) : (
        <Text style={[styles.duration, { color: colors.mutedForeground }]}>{song.duration}</Text>
      )}
      {!compact && (
        <Pressable
          accessibilityLabel={favorites.includes(song.id) ? 'Remove from favorites' : 'Add to favorites'}
          hitSlop={10}
          onPress={() => toggleFavorite(song.id)}
          style={styles.rowAction}
        >
          <Feather name="heart" size={17} color={favorites.includes(song.id) ? colors.rose : colors.mutedForeground} fill={favorites.includes(song.id) ? colors.rose : 'transparent'} />
        </Pressable>
      )}
    </Pressable>
  );
}

export function ProgressBar({ large = false }: { large?: boolean }) {
  const colors = useColors();
  const { progress, seek, currentSong } = usePlayer();
  return (
    <View>
      <Pressable
        accessibilityLabel="Song progress"
        onPress={(event) => seek(Math.max(0, Math.min(100, (event.nativeEvent.locationX / 260) * 100)))}
        style={[styles.progressTrack, large && styles.progressTrackLarge, { backgroundColor: colors.muted }]}
      >
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.rose }]} />
        <View style={[styles.progressThumb, { left: `${progress}%`, backgroundColor: colors.paper, borderColor: colors.rose }]} />
      </Pressable>
      {large && (
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatTime((currentSong.seconds * progress) / 100)}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{currentSong.duration}</Text>
        </View>
      )}
    </View>
  );
}

export function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const colors = useColors();
  const { currentSong, next } = usePlayer();
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.miniPlayer, { backgroundColor: colors.glassStrong, borderColor: colors.border }, pressed && styles.pressed]}>
      <CoverArt source={currentSong.cover} size={45} radius={9} />
      <View style={styles.miniCopy}>
        <Text numberOfLines={1} style={[styles.miniTitle, { color: colors.foreground }]}>{currentSong.title}</Text>
        <Text numberOfLines={1} style={[styles.miniArtist, { color: colors.mutedForeground }]}>{currentSong.artist}</Text>
      </View>
      <PlayButton small />
      <Pressable accessibilityLabel="Next song" hitSlop={10} onPress={next} style={styles.miniNext}>
        <Feather name="skip-forward" size={19} color={colors.foreground} />
      </Pressable>
    </Pressable>
  );
}

export function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  playButton: { alignItems: 'center', justifyContent: 'center', borderRadius: 999, shadowColor: '#d9475f', shadowOpacity: 0.48, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  songRow: { minHeight: 75, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderRadius: 15 },
  songRowCompact: { minHeight: 68 },
  index: { width: 21, fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  songCopy: { flex: 1, minWidth: 0 },
  songTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  songArtist: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  duration: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  equalizer: { width: 25, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 19 },
  eqBar: { width: 3, borderRadius: 3 },
  rowAction: { paddingLeft: 5 },
  progressTrack: { height: 4, borderRadius: 10, width: '100%', position: 'relative' },
  progressTrackLarge: { height: 5 },
  progressFill: { height: '100%', borderRadius: 10 },
  progressThumb: { position: 'absolute', top: -5, marginLeft: -6, width: 14, height: 14, borderRadius: 9, borderWidth: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  time: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  miniPlayer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 18, borderWidth: 1, gap: 10 },
  miniCopy: { flex: 1, minWidth: 0 },
  miniTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  miniArtist: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  miniNext: { padding: 4 },
});
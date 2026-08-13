import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoverArt, PlayButton, ProgressBar, SongRow } from '@/components/PlayerPieces';
import { usePlayer } from '@/context/PlayerContext';
import { useColors } from '@/hooks/useColors';

export default function NowPlayingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { songs, currentSong, currentIndex, previous, next, favorites, toggleFavorite, shuffle, repeat, setShuffle, setRepeat } = usePlayer();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['rgba(115, 49, 33, 0.38)', colors.background]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 23, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Close player" onPress={() => router.back()} style={[styles.topButton, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <Feather name="chevron-down" size={21} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.mutedForeground }]}>NOW PLAYING</Text>
          <Pressable accessibilityLabel="More options" style={[styles.topButton, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <Feather name="more-horizontal" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.artShadow}>
          <CoverArt source={currentSong.cover} size={300} radius={18} />
        </View>
        <View style={styles.trackHeading}>
          <View style={styles.trackCopy}>
            <Text style={[styles.title, { color: colors.foreground }]}>{currentSong.title}</Text>
            <Text style={[styles.artist, { color: colors.rose }]}>{currentSong.artist}</Text>
            <Text style={[styles.album, { color: colors.mutedForeground }]}>{currentSong.album} · {currentSong.year}</Text>
          </View>
          <Pressable accessibilityLabel={favorites.includes(currentSong.id) ? 'Remove from favorites' : 'Add to favorites'} onPress={() => toggleFavorite(currentSong.id)} style={[styles.favoriteButton, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <Feather name="heart" size={20} color={favorites.includes(currentSong.id) ? colors.rose : colors.foreground} fill={favorites.includes(currentSong.id) ? colors.rose : 'transparent'} />
          </Pressable>
        </View>
        <ProgressBar large />
        <View style={styles.controls}>
          <Pressable accessibilityLabel="Shuffle" onPress={setShuffle} style={styles.controlButton}>
            <Feather name="shuffle" size={19} color={shuffle ? colors.rose : colors.mutedForeground} />
          </Pressable>
          <Pressable accessibilityLabel="Previous song" onPress={previous} style={styles.controlButton}>
            <Feather name="skip-back" size={25} color={colors.foreground} fill={colors.foreground} />
          </Pressable>
          <PlayButton />
          <Pressable accessibilityLabel="Next song" onPress={next} style={styles.controlButton}>
            <Feather name="skip-forward" size={25} color={colors.foreground} fill={colors.foreground} />
          </Pressable>
          <Pressable accessibilityLabel="Repeat" onPress={setRepeat} style={styles.controlButton}>
            <Feather name="repeat" size={19} color={repeat ? colors.rose : colors.mutedForeground} />
          </Pressable>
        </View>
        <View style={styles.upNextHeader}>
          <View>
            <Text style={[styles.upNextEyebrow, { color: colors.gold }]}>UP NEXT</Text>
            <Text style={[styles.upNextTitle, { color: colors.foreground }]}>Continue the feeling</Text>
          </View>
          <Text style={[styles.queueCount, { color: colors.mutedForeground }]}>{songs.length - currentIndex - 1} songs</Text>
        </View>
        {songs.slice(currentIndex + 1, currentIndex + 4).map((song, index) => <SongRow key={song.id} song={song} index={currentIndex + index + 1} compact />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 },
  topButton: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_700Bold' },
  artShadow: { alignItems: 'center', marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 13 },
  trackHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 23 },
  trackCopy: { flex: 1 },
  title: { fontSize: 26, letterSpacing: -0.8, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  artist: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  album: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  favoriteButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 36 },
  controlButton: { width: 38, height: 45, alignItems: 'center', justifyContent: 'center' },
  upNextHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  upNextEyebrow: { fontSize: 9, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  upNextTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  queueCount: { fontSize: 11, fontFamily: 'Inter_400Regular', paddingBottom: 2 },
});

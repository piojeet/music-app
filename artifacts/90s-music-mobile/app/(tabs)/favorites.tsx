import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer, SongRow } from '@/components/PlayerPieces';
import { usePlayer } from '@/context/PlayerContext';
import { useColors } from '@/hooks/useColors';

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, songs } = usePlayer();
  const favoriteSongs = useMemo(() => songs.filter((song) => favorites.includes(song.id)), [favorites, songs]);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={favoriteSongs}
        keyExtractor={(song) => song.id}
        renderItem={({ item, index }) => <SongRow song={item} index={index} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 20, paddingBottom: insets.bottom + 122, flexGrow: favoriteSongs.length === 0 ? 1 : undefined }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.rose }]}>SAVED FOR LATER</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>Favorites</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{favoriteSongs.length} songs you want to keep close</Text>
            </View>
            <Pressable onPress={() => router.push('/')} style={[styles.headerButton, { borderColor: colors.border, backgroundColor: colors.glass }]}>
              <Feather name="home" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.glass }]}>
            <View style={[styles.heartCircle, { backgroundColor: colors.muted }]}>
              <Feather name="heart" size={22} color={colors.rose} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Keep the good ones close</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Tap the heart beside any song to save it here.</Text>
            <Pressable onPress={() => router.push('/playlist')} style={[styles.browseButton, { backgroundColor: colors.rose }]}>
              <Text style={[styles.browseText, { color: colors.primaryForeground }]}>Browse library</Text>
            </Pressable>
          </View>
        }
      />
      <View style={[styles.floatingPlayer, { bottom: insets.bottom + 76 }]}>
        <MiniPlayer onOpen={() => router.push('/now-playing')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 30, letterSpacing: -0.8, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  headerButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  empty: { padding: 30, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  heartCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  emptyText: { fontSize: 12, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 18, maxWidth: 240 },
  browseButton: { marginTop: 20, borderRadius: 11, paddingHorizontal: 17, paddingVertical: 11 },
  browseText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  floatingPlayer: { position: 'absolute', left: 14, right: 14 },
});

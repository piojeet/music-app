import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SongRow } from '@/components/PlayerPieces';
import { useColors } from '@/hooks/useColors';
import { MiniPlayer } from '@/components/PlayerPieces';
import { usePlayer } from '@/context/PlayerContext';

export default function PlaylistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { songs } = usePlayer();
  const filtered = useMemo(
    () => songs.filter((song) => `${song.title} ${song.artist} ${song.album} ${song.genre}`.toLowerCase().includes(query.toLowerCase())),
    [query, songs],
  );
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(song) => song.id}
        renderItem={({ item, index }) => <SongRow song={item} index={index} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 20, paddingBottom: insets.bottom + 122 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.gold }]}>THE ARCHIVE</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Your library</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{songs.length} tracks from the golden era</Text>
              </View>
              <Pressable onPress={() => router.push('/')} style={[styles.headerButton, { borderColor: colors.border, backgroundColor: colors.glass }]}>
                <Feather name="home" size={18} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.glass }]}>
              <Feather name="search" color={colors.mutedForeground} size={17} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Search songs, artists, albums" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} />
              {query.length > 0 && <Pressable onPress={() => setQuery('')}><Feather name="x-circle" color={colors.mutedForeground} size={16} /></Pressable>}
            </View>
            <View style={styles.filterRow}>
              <Text style={[styles.resultText, { color: colors.mutedForeground }]}>{filtered.length} results</Text>
              <View style={[styles.filterChip, { backgroundColor: colors.muted }]}>
                <Feather name="sliders" size={12} color={colors.gold} />
                <Text style={[styles.filterText, { color: colors.foreground }]}>All eras</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.glass }]}>
            <Feather name="search" size={24} color={colors.gold} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing in the archive</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Try a different song, artist, or album.</Text>
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
  search: { height: 50, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, marginBottom: 14 },
  input: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  resultText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  filterChip: { flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  filterText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  empty: { padding: 30, borderWidth: 1, borderRadius: 18, alignItems: 'center', marginTop: 14 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 12, marginBottom: 6 },
  emptyText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  floatingPlayer: { position: 'absolute', left: 14, right: 14 },
});

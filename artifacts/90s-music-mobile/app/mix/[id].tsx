import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CoverArt, MiniPlayer, SongRow } from "@/components/PlayerPieces";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import type { Song } from "@/data/music";

type Mix = { id: string; title: string; subtitle: string; image?: string; imageUrl?: string; songIds: string[] };
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const MIXES_API_URL = API_BASE_URL.endsWith("/api") ? `${API_BASE_URL}/mixes` : `${API_BASE_URL}/api/mixes`;

export default function MixScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mixId = Array.isArray(id) ? id[0] : id;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const [mix, setMix] = useState<Mix | null>(null);

  useEffect(() => {
    fetch(MIXES_API_URL).then((response) => response.ok ? response.json() : []).then((items: unknown) => {
      if (Array.isArray(items)) setMix((items as Mix[]).find((item) => item.id === mixId) || null);
    }).catch(() => setMix(null));
  }, [mixId]);

  const mixSongs = useMemo(() => mix ? mix.songIds.map((songId) => player.songs.find((song) => song.id === songId)).filter((song): song is Song => Boolean(song)) : [], [mix, player.songs]);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <FlatList data={mixSongs} keyExtractor={(song) => song.id} renderItem={({ item, index }) => <SongRow song={item} index={index} queue={mixSongs} />}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 124, flexGrow: 1 }}
      ListHeaderComponent={<View><Pressable accessibilityLabel="Go back" hitSlop={12} onPress={() => router.back()} style={styles.back}><Feather name="chevron-left" size={28} color={colors.foreground} /></Pressable><View style={styles.hero}>{mix?.image || mix?.imageUrl ? <CoverArt source={{ uri: mix.image || mix.imageUrl }} size={116} radius={16} /> : <View style={[styles.coverPlaceholder, { backgroundColor: colors.muted }]} />}<Text numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>{mix?.title || "Made For You"}</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{mix?.subtitle || "Your mix"} · {mixSongs.length} songs</Text><Pressable disabled={!mixSongs.length} onPress={() => player.playSong(mixSongs[0], mixSongs)} style={({ pressed }) => [styles.play, { backgroundColor: colors.rose, opacity: mixSongs.length ? 1 : .5 }, pressed && styles.pressed]}><Feather name="play" size={18} color={colors.primaryForeground} fill={colors.primaryForeground} /><Text style={[styles.playText, { color: colors.primaryForeground }]}>Play</Text></Pressable><Text style={[styles.label, { color: colors.gold }]}>SONGS</Text></View></View>}
      ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>No songs have been added to this mix yet.</Text>} />
    <View style={[styles.mini, { bottom: insets.bottom + 76 }]}><MiniPlayer onOpen={() => router.push("/now-playing")} /></View>
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, back: { height: 32, justifyContent: "center" }, hero: { alignItems: "center", paddingTop: 18, paddingBottom: 18 }, coverPlaceholder: { width: 116, height: 116, borderRadius: 16 }, title: { fontFamily: "Inter_700Bold", fontSize: 25, marginTop: 14, textAlign: "center" }, subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6 }, play: { marginTop: 18, minWidth: 126, height: 46, borderRadius: 23, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, playText: { fontFamily: "Inter_700Bold", fontSize: 14 }, label: { alignSelf: "stretch", fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.8, marginTop: 28, marginBottom: 12 }, mini: { position: "absolute", left: 14, right: 14 }, empty: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 13, paddingTop: 30 }, pressed: { opacity: .78, transform: [{ scale: .98 }] } });

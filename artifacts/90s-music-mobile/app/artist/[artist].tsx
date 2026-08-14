import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CoverArt, MiniPlayer, SongRow } from "@/components/PlayerPieces";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

export default function ArtistScreen() {
  const { artist: artistParam } = useLocalSearchParams<{ artist: string }>();
  const artist = Array.isArray(artistParam) ? artistParam[0] : artistParam;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const artistSongs = useMemo(
    () => player.songs.filter((song) => song.artist === artist),
    [artist, player.songs],
  );
  const cover = artistSongs[0]?.cover;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={artistSongs}
        keyExtractor={(song) => song.id}
        renderItem={({ item, index }) => <SongRow song={item} index={index} queue={artistSongs} />}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 124,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Go back"
                hitSlop={12}
                onPress={() => router.back()}
              >
                <Feather name="chevron-left" size={28} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.hero}>
              {cover ? (
                <CoverArt source={cover} size={108} radius={54} />
              ) : (
                <View style={[styles.placeholder, { backgroundColor: colors.muted }]}>
                  <Feather name="user" size={42} color={colors.gold} />
                </View>
              )}
              <Text numberOfLines={2} style={[styles.artist, { color: colors.foreground }]}>
                {artist || "Artist"}
              </Text>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {artistSongs.length} {artistSongs.length === 1 ? "song" : "songs"}
              </Text>
              <Pressable
                disabled={!artistSongs.length}
                onPress={() => player.playSong(artistSongs[0], artistSongs)}
                style={({ pressed }) => [
                  styles.playAll,
                  { backgroundColor: colors.rose, opacity: artistSongs.length ? 1 : 0.5 },
                  pressed && styles.pressed,
                ]}
              >
                <Feather name="play" size={18} color={colors.primaryForeground} fill={colors.primaryForeground} />
                <Text style={[styles.playText, { color: colors.primaryForeground }]}>Play</Text>
              </Pressable>
              <Text style={[styles.sectionLabel, { color: colors.gold }]}>SONGS</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No songs available for this artist.</Text>
          </View>
        }
      />
      <View style={[styles.mini, { bottom: insets.bottom + 76 }]}>
        <MiniPlayer onOpen={() => router.push("/now-playing")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { height: 32, justifyContent: "center" },
  hero: { alignItems: "center", paddingTop: 18, paddingBottom: 18 },
  placeholder: { width: 108, height: 108, borderRadius: 54, alignItems: "center", justifyContent: "center" },
  artist: { fontFamily: "Inter_700Bold", fontSize: 25, marginTop: 14, textAlign: "center" },
  count: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6 },
  playAll: { marginTop: 18, minWidth: 126, height: 46, borderRadius: 23, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  playText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  sectionLabel: { alignSelf: "stretch", fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.8, marginTop: 28, marginBottom: 12 },
  mini: { position: "absolute", left: 14, right: 14 },
  empty: { alignItems: "center", paddingTop: 36 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CoverArt, PlayButton } from "@/components/PlayerPieces";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
const mixes = [
  ["heart", "Chill Mix", "#332052"],
  ["activity", "Workout Mix", "#56350d"],
  ["target", "Focus Mix", "#112d59"],
  ["heart", "Romance Mix", "#52201f"],
] as const;
const menu = [
  ["home", "Home", "/(tabs)"],
  ["grid", "Browse", "/search"],
  ["search", "Search", "/search"],
  ["music", "Library", "/playlist"],
  ["heart", "Favorites", "/favorites"],
  ["download", "Downloads", "/playlist"],
  ["list", "Playlists", "/playlist"],
  ["disc", "Albums", "/playlist"],
  ["users", "Artists", "/playlist"],
  ["sliders", "Equalizer", "/now-playing"],
  ["settings", "Settings", "/now-playing"],
  ["clock", "Sleep Timer", "/now-playing"],
  ["info", "About PlayTune", "/now-playing"],
] as const;
type Artist = { id: string; name: string; image?: string; imageUrl?: string };
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://music-app-83f1.onrender.com";
const ARTISTS_API_URL = API_BASE_URL.endsWith("/api/artists")
  ? API_BASE_URL
  : API_BASE_URL.endsWith("/api")
    ? `${API_BASE_URL}/artists`
    : `${API_BASE_URL}/api/artists`;
export default function Home() {
  const c = useColors(),
    insets = useSafeAreaInsets(),
    p = usePlayer(),
    [open, setOpen] = useState(false),
    [artists, setArtists] = useState<Artist[]>([]),
    recent = p.songs.slice(0, 4);
  const loadArtists = useCallback(() => {
    fetch(ARTISTS_API_URL)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setArtists(data as Artist[]);
      })
      .catch(() => setArtists([]));
  }, []);
  useEffect(() => {
    loadArtists();
    const refreshTimer = setInterval(loadArtists, 15000);
    return () => clearInterval(refreshTimer);
  }, [loadArtists]);
  return (
    <View style={[s.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 155,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.top}>
          <Pressable
            onPress={() => setOpen(true)}
          >
            <Feather name="menu" size={30} color={c.gold} />
          </Pressable>
          <View style={s.right}>
            <Feather name="bell" size={23} color={c.gold} />
            {p.songs[0] && (
              <View style={[s.avatar, { borderColor: c.gold }]}>
                <CoverArt source={p.songs[0].cover} size={40} radius={20} />
              </View>
            )}
          </View>
        </View>
        <View style={s.pad}>
          <Text style={[s.h1, { color: c.foreground }]}>Good Evening</Text>
          <Text style={[s.sub, { color: c.mutedForeground }]}>
            Let’s listen to something great
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/search")}
          style={[
            s.search,
            { backgroundColor: c.input, borderColor: c.border },
          ]}
        >
          <Feather name="search" size={22} color={c.mutedForeground} />
          <Text style={[s.searchText, { color: c.mutedForeground }]}>
            Search songs, artists, albums...
          </Text>
          <Feather name="sliders" size={20} color={c.gold} />
        </Pressable>
        <Head title="Recently Played" c={c} />
        <Rail songs={recent} p={p} c={c} />
        <Head title="Made For You" c={c} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.rail}
        >
          {mixes.map(([i, t, b]) => (
            <View
              key={t}
              style={[s.mix, { backgroundColor: b, borderColor: c.border }]}
            >
              <Feather name={i} size={23} color={c.gold} />
              <Text style={[s.mixT, { color: c.foreground }]}>{t}</Text>
              <Text style={s.mixS}>Made for you</Text>
            </View>
          ))}
        </ScrollView>
        {artists.length > 0 && <Head title="Popular Artists" c={c} />}
        {artists.length > 0 && <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.rail}
        >
          {artists.map((a) => (
            <Pressable
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: "/artist/[artist]",
                  params: { artist: a.name },
                } as never)
              }
              style={s.artist}
            >
              <CoverArt source={{ uri: a.image || a.imageUrl || "" }} size={92} radius={46} />
              <Text
                numberOfLines={1}
                style={[s.artistT, { color: c.foreground }]}
              >
                {a.name}
              </Text>
              <Text style={[s.artistS, { color: c.mutedForeground }]}>
                Artist
              </Text>
            </Pressable>
          ))}
        </ScrollView>}
        <Head title="Trending Now" c={c} />
        <View
          style={[
            s.trending,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {p.songs.slice(0, 3).map((x, n) => (
            <View
              key={x.id}
              style={[
                s.row,
                n < 2 && { borderBottomWidth: 1, borderColor: c.border },
              ]}
            >
              <Text style={[s.rank, { color: c.gold }]}>{n + 1}</Text>
              <CoverArt source={x.cover} size={48} radius={7} />
              <Pressable onPress={() => p.playSong(x)} style={{ flex: 1 }}>
                <Text style={[s.song, { color: c.foreground }]}>{x.title}</Text>
                <Text style={[s.songS, { color: c.mutedForeground }]}>
                  {x.artist}
                </Text>
              </Pressable>
              <Pressable onPress={() => p.toggleFavorite(x.id)}>
                <Feather
                  name="heart"
                  size={21}
                  color={c.gold}
                  fill={p.favorites.includes(x.id) ? c.gold : "transparent"}
                />
              </Pressable>
              <Feather name="more-vertical" size={19} color={c.foreground} />
            </View>
          ))}
        </View>
      </ScrollView>
      <View
        style={[
          s.now,
          {
            bottom: insets.bottom + 65,
            backgroundColor: c.glassStrong,
            borderColor: c.gold,
          },
        ]}
      >
        <CoverArt source={p.currentSong.cover} size={57} radius={8} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[s.song, { color: c.foreground }]}>
            {p.currentSong.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[s.songS, { color: c.mutedForeground }]}
          >
            {p.currentSong.artist}
          </Text>
        </View>
        <Pressable onPress={p.previous}>
          <Feather name="skip-back" size={20} color={c.foreground} />
        </Pressable>
        <PlayButton small />
        <Pressable onPress={p.next}>
          <Feather name="skip-forward" size={20} color={c.foreground} />
        </Pressable>
      </View>
      {open && (
        <Drawer
          c={c}
          close={() => {
            setOpen(false);
          }}
        />
      )}
    </View>
  );
}
function Head({ title, c }: { title: string; c: any }) {
  return (
    <View style={s.head}>
      <Text style={[s.headT, { color: c.foreground }]}>{title}</Text>
      <Text style={[s.see, { color: c.gold }]}>See all</Text>
    </View>
  );
}
function Rail({ songs, p, c }: { songs: any[]; p: any; c: any }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.rail}
    >
      {songs.map((x) => (
        <Pressable key={x.id} onPress={() => p.playSong(x)} style={s.tile}>
          <CoverArt source={x.cover} size={146} radius={11} />
          <Text
            numberOfLines={1}
            style={[s.song, { color: c.foreground, marginTop: 8 }]}
          >
            {x.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[s.songS, { color: c.mutedForeground }]}
          >
            {x.artist}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
function Drawer({ c, close }: { c: any; close: () => void }) {
  const slideX = React.useRef(
    new Animated.Value(-Dimensions.get("window").width),
  ).current;
  const isClosing = React.useRef(false);

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [slideX]);

  const handleClose = (afterClose?: () => void) => {
    if (isClosing.current) return;

    isClosing.current = true;
    Animated.timing(slideX, {
      toValue: -Dimensions.get("window").width,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        close();
        afterClose?.();
      }
    });
  };

  return (
    <View style={s.overlay}>
      <Pressable onPress={() => handleClose()} style={s.backdrop} />
      <Animated.ScrollView
        style={[
          s.drawer,
          {
            backgroundColor: c.background,
            borderColor: c.border,
            transform: [{ translateX: slideX }],
          },
        ]}
        contentContainerStyle={{ paddingTop: 22, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={s.profile}>
          <View style={[s.avatar, { borderColor: c.gold }]}>
            <Feather name="user" size={23} color={c.gold} />
          </View>
          <View>
            <Text style={[s.profileT, { color: c.foreground }]}>
              PlayTune listener
            </Text>
            <Text style={[s.profileS, { color: c.mutedForeground }]}>
              Your music, your way
            </Text>
          </View>
        </View>
        {menu.map(([icon, label, path], n) => (
          <React.Fragment key={label}>
            {[7, 9].includes(n) && (
              <Text style={[s.group, { color: c.gold }]}>
                {n === 7 ? "YOUR MUSIC" : "MORE"}
              </Text>
            )}
            <Pressable
              onPress={() => {
                handleClose(() => router.push(path as never));
              }}
              style={[s.menu, n === 0 && { backgroundColor: c.muted }]}
            >
              <Feather
                name={icon}
                size={23}
                color={n === 0 ? c.gold : c.foreground}
              />
              <Text
                style={[s.menuT, { color: n === 0 ? c.gold : c.foreground }]}
              >
                {label}
              </Text>
              <Feather name="chevron-right" size={20} color={c.foreground} />
            </Pressable>
          </React.Fragment>
        ))}
        <View style={[s.premium, { borderColor: c.gold }]}>
          <Feather name="award" size={27} color={c.gold} />
          <View style={{ flex: 1 }}>
            <Text style={[s.premiumT, { color: c.gold }]}>
              PlayTune Premium
            </Text>
            <Text style={[s.premiumS, { color: c.mutedForeground }]}>
              Offline downloads & more.
            </Text>
          </View>
          <View style={[s.upgrade, { backgroundColor: c.gold }]}>
            <Text style={s.upgradeT}>Upgrade</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1 },
  top: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  right: { flexDirection: "row", alignItems: "center", gap: 17 },
  avatar: {
    height: 46,
    width: 46,
    borderRadius: 23,
    borderWidth: 1,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pad: { paddingHorizontal: 20, marginTop: 22 },
  h1: { fontFamily: "Inter_700Bold", fontSize: 25 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 5 },
  search: {
    margin: 20,
    height: 57,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 13,
  },
  searchText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13 },
  head: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headT: { fontFamily: "Inter_700Bold", fontSize: 18 },
  see: { fontFamily: "Inter_500Medium", fontSize: 12 },
  rail: { gap: 15, paddingHorizontal: 20 },
  tile: { width: 146 },
  song: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  songS: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  mix: {
    width: 146,
    height: 145,
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    gap: 10,
  },
  mixT: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 8 },
  mixS: { color: "#ddd", fontSize: 11, fontFamily: "Inter_400Regular" },
  artist: { width: 92, alignItems: "center" },
  artistT: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 8 },
  artistS: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3 },
  trending: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
  },
  row: { height: 77, flexDirection: "row", alignItems: "center", gap: 12 },
  rank: {
    width: 22,
    fontSize: 21,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  now: {
    height: 83,
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
    flexDirection: "row",
  },
  backdrop: { flex: 1, backgroundColor: "#000a" },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "76%",
    borderRightWidth: 1,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#2a2d34",
  },
  profileT: { fontFamily: "Inter_700Bold", fontSize: 15 },
  profileS: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 5 },
  menu: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 24,
  },
  menuT: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
  group: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 6,
  },
  premium: {
    margin: 20,
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  premiumT: { fontFamily: "Inter_700Bold", fontSize: 14 },
  premiumS: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4 },
  upgrade: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 8 },
  upgradeT: { fontFamily: "Inter_700Bold", color: "#17120b", fontSize: 11 },
});

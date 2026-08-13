import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CoverArt, MiniPlayer, PlayButton, SongRow } from '@/components/PlayerPieces';
import { usePlayer } from '@/context/PlayerContext';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState(false);
  const { songs, currentSong, playSong } = usePlayer();
  const featured = songs[0];
  const mixes = useMemo(
    () => songs.slice(0, 3).map((song, index) => ({
      label: song.album || song.title,
      sub: song.artist,
      cover: song.cover,
      accent: [colors.rose, colors.gold, colors.ember][index],
      song,
    })),
    [songs, colors.rose, colors.gold, colors.ember],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 118 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.gold }]}>90'S MUSIC</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Good evening,{"\n"}music lover.</Text>
          </View>
          <Pressable accessibilityLabel="Open menu" onPress={() => setShowMenu((open) => !open)} style={[styles.menuButton, { borderColor: colors.border, backgroundColor: colors.glass }]}>
            <Feather name={showMenu ? 'x' : 'menu'} size={20} color={colors.foreground} />
          </Pressable>
        </View>
        {showMenu && (
          <View style={[styles.menuCard, { backgroundColor: colors.glassStrong, borderColor: colors.border }]}>
            <Text style={[styles.menuEyebrow, { color: colors.mutedForeground }]}>YOUR COLLECTION</Text>
            <Pressable onPress={() => { setShowMenu(false); router.push('/playlist'); }} style={styles.menuItem}>
              <Feather name="list" color={colors.foreground} size={17} />
              <Text style={[styles.menuText, { color: colors.foreground }]}>Browse library</Text>
            </Pressable>
            <Pressable onPress={() => { setShowMenu(false); router.push('/favorites'); }} style={styles.menuItem}>
              <Feather name="heart" color={colors.foreground} size={17} />
              <Text style={[styles.menuText, { color: colors.foreground }]}>Your favorites</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.searchBar}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>Search your memories</Text>
          <View style={[styles.searchShortcut, { backgroundColor: colors.muted }]}>
            <Text style={[styles.searchShortcutText, { color: colors.mutedForeground }]}>⌘ K</Text>
          </View>
        </View>

        <ImageBackground source={require('../../assets/images/hero-90s.jpg')} imageStyle={styles.heroImage} style={styles.hero}>
          <LinearGradient colors={['rgba(12, 8, 7, 0.22)', 'rgba(12, 8, 7, 0.96)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroCopy}>
            <View style={[styles.heroPill, { backgroundColor: 'rgba(214,162,74,0.16)', borderColor: 'rgba(214,162,74,0.3)' }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.gold }]} />
              <Text style={[styles.heroPillText, { color: colors.softGold }]}>THE GOLDEN ERA</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.paper }]}>Press play on{"\n"}a feeling.</Text>
            <Text style={[styles.heroDescription, { color: 'rgba(245, 227, 194, 0.72)' }]}>The songs that made every moment feel like a movie.</Text>
            <Pressable accessibilityLabel="Start listening" disabled={!featured} onPress={() => featured && playSong(featured)} style={({ pressed }) => [styles.heroCta, { backgroundColor: colors.rose, opacity: featured ? 1 : 0.55 }, pressed && styles.pressed]}>
              <Feather name="play" size={15} color={colors.primaryForeground} fill={colors.primaryForeground} />
              <Text style={[styles.heroCtaText, { color: colors.primaryForeground }]}>Start listening</Text>
            </Pressable>
          </View>
          <View style={styles.heroStamp}>
            <Text style={[styles.stampBig, { color: colors.paper }]}>90</Text>
            <Text style={[styles.stampSmall, { color: colors.gold }]}>FOREVER</Text>
          </View>
        </ImageBackground>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.rose }]}>NOW PLAYING</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your current mood</Text>
          </View>
          <Pressable onPress={() => router.push('/now-playing')} hitSlop={10}>
            <Text style={[styles.linkText, { color: colors.gold }]}>Open player</Text>
          </Pressable>
        </View>
        <View style={[styles.nowPlayingCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
          <CoverArt source={currentSong.cover} size={105} radius={13} />
          <View style={styles.nowCopy}>
            <View style={styles.nowTopLine}>
              <Text style={[styles.nowLabel, { color: colors.mutedForeground }]}>LISTENING TO</Text>
              <Feather name="more-horizontal" size={19} color={colors.mutedForeground} />
            </View>
            <Text numberOfLines={1} style={[styles.nowTitle, { color: colors.foreground }]}>{currentSong.title}</Text>
            <Text numberOfLines={1} style={[styles.nowArtist, { color: colors.rose }]}>{currentSong.artist}</Text>
            <Text numberOfLines={1} style={[styles.nowAlbum, { color: colors.mutedForeground }]}>{currentSong.album} · {currentSong.year}</Text>
            <View style={styles.nowControls}>
              <PlayButton small />
              <Pressable accessibilityLabel="Open full player" onPress={() => router.push('/now-playing')} style={[styles.circleControl, { backgroundColor: colors.muted }]}>
                <Feather name="maximize-2" size={15} color={colors.foreground} />
              </Pressable>
            </View>
          </View>
        </View>

        {mixes.length > 0 && <>
          <View style={[styles.sectionHeader, { marginTop: 29 }]}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.gold }]}>MADE FOR YOU</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your uploaded music</Text>
            </View>
            <Pressable onPress={() => router.push('/playlist')} hitSlop={10}>
              <Text style={[styles.linkText, { color: colors.gold }]}>See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mixRail}>
          {mixes.map((mix) => (
            <Pressable key={mix.song.id} onPress={() => playSong(mix.song)} style={({ pressed }) => [styles.mixCard, { backgroundColor: colors.glass, borderColor: colors.border }, pressed && styles.pressed]}>
              <View style={[styles.mixArtWrap, { backgroundColor: mix.accent }]}>
                <CoverArt source={mix.cover} size={116} radius={10} />
                <View style={[styles.mixPlay, { backgroundColor: mix.accent }]}>
                  <Feather name="play" size={13} color={colors.ink} fill={colors.ink} />
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.mixTitle, { color: colors.foreground }]}>{mix.label}</Text>
              <Text numberOfLines={1} style={[styles.mixSub, { color: colors.mutedForeground }]}>{mix.sub}</Text>
            </Pressable>
          ))}
          </ScrollView>
        </>}

        <View style={[styles.sectionHeader, { marginTop: 29 }]}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.rose }]}>THE PLAYLIST</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tonight's top tracks</Text>
          </View>
          <Pressable onPress={() => router.push('/playlist')} hitSlop={10}>
            <Text style={[styles.linkText, { color: colors.gold }]}>View all</Text>
          </Pressable>
        </View>
        {songs.length > 0 ? songs.slice(0, 4).map((song, index) => <SongRow key={song.id} song={song} index={index} compact />) : (
          <Text style={[styles.emptyLibrary, { color: colors.mutedForeground }]}>Your uploaded songs will appear here.</Text>
        )}
      </ScrollView>
      <View style={[styles.floatingPlayer, { bottom: insets.bottom + 76 }]}>
        <MiniPlayer onOpen={() => router.push('/now-playing')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  kicker: { fontSize: 11, letterSpacing: 2.6, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  headerTitle: { fontSize: 28, lineHeight: 33, letterSpacing: -0.7, fontFamily: 'Inter_700Bold' },
  menuButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  menuCard: { position: 'absolute', zIndex: 10, right: 20, top: 71, width: 190, padding: 15, borderRadius: 16, borderWidth: 1 },
  menuEyebrow: { fontSize: 9, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  menuText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  searchBar: { height: 48, borderRadius: 15, borderWidth: 1, borderColor: '#3b2b25', backgroundColor: 'rgba(31, 21, 18, 0.58)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, marginBottom: 20 },
  searchPlaceholder: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  searchShortcut: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  searchShortcutText: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  hero: { minHeight: 250, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 28 },
  heroImage: { borderRadius: 22 },
  heroCopy: { padding: 20, width: '76%' },
  heroPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderRadius: 99, marginBottom: 14 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  heroPillText: { fontSize: 8, letterSpacing: 1.3, fontFamily: 'Inter_700Bold' },
  heroTitle: { fontSize: 30, lineHeight: 33, letterSpacing: -1, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  heroDescription: { fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  heroCta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12 },
  heroCtaText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  heroStamp: { position: 'absolute', top: 21, right: 20, alignItems: 'center', transform: [{ rotate: '11deg' }] },
  stampBig: { fontSize: 45, lineHeight: 43, fontFamily: 'Inter_700Bold', opacity: 0.78 },
  stampSmall: { fontSize: 8, letterSpacing: 2, fontFamily: 'Inter_700Bold' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 13 },
  sectionEyebrow: { fontSize: 9, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  sectionTitle: { fontSize: 19, letterSpacing: -0.3, fontFamily: 'Inter_700Bold' },
  linkText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', paddingBottom: 2 },
  nowPlayingCard: { borderRadius: 19, borderWidth: 1, padding: 13, flexDirection: 'row', gap: 13 },
  nowCopy: { flex: 1, minWidth: 0, paddingTop: 2 },
  nowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nowLabel: { fontSize: 8, letterSpacing: 1.3, fontFamily: 'Inter_700Bold' },
  nowTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 9, marginBottom: 4 },
  nowArtist: { fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 5 },
  nowAlbum: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  nowControls: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  circleControl: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mixRail: { gap: 12, paddingRight: 10 },
  mixCard: { width: 148, borderRadius: 16, borderWidth: 1, padding: 10 },
  mixArtWrap: { height: 124, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
  mixPlay: { position: 'absolute', right: 7, bottom: 7, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mixTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  mixSub: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  floatingPlayer: { position: 'absolute', left: 14, right: 14 },
  emptyLibrary: { fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 18 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});

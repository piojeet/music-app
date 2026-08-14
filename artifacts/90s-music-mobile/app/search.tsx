import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer, SongRow } from '@/components/PlayerPieces';
import { usePlayer } from '@/context/PlayerContext';
import { useColors } from '@/hooks/useColors';

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { songs } = usePlayer();
  const results = useMemo(() => songs.filter((song) => `${song.title} ${song.artist} ${song.album} ${song.genre}`.toLowerCase().includes(query.trim().toLowerCase())), [query, songs]);
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <FlatList data={query ? results : songs.slice(0, 6)} keyExtractor={(song) => song.id} renderItem={({ item, index }) => <SongRow song={item} index={index} />} contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 20, paddingBottom: insets.bottom + 124, flexGrow: 1 }}
      ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="chevron-left" size={26} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>Search</Text><View style={{ width: 26 }} /></View><View style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.border }]}><Feather name="search" size={18} color={colors.mutedForeground}/><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Songs, artists, albums" placeholderTextColor={colors.mutedForeground} style={[styles.input,{ color: colors.foreground }]} />{Boolean(query) && <Pressable onPress={() => setQuery('')}><Feather name="x" size={18} color={colors.mutedForeground}/></Pressable>}</View><Text style={[styles.label, { color: colors.gold }]}>{query ? 'RESULTS' : 'RECENTLY ADDED'}</Text></>}
      ListEmptyComponent={<View style={styles.empty}><Feather name="search" size={32} color={colors.gold}/><Text style={[styles.emptyTitle,{color:colors.foreground}]}>No results found</Text><Text style={[styles.emptyText,{color:colors.mutedForeground}]}>Try a song, artist, album, or genre.</Text></View>} />
    <View style={[styles.mini,{bottom:insets.bottom+76}]}><MiniPlayer onOpen={() => router.push('/now-playing')}/></View>
  </View>;
}
const styles=StyleSheet.create({screen:{flex:1},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},title:{fontFamily:'Inter_700Bold',fontSize:24},inputWrap:{height:50,borderWidth:1,borderRadius:15,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14,marginBottom:26},input:{flex:1,fontFamily:'Inter_400Regular',fontSize:14},label:{fontFamily:'Inter_700Bold',fontSize:10,letterSpacing:1.8,marginBottom:12},mini:{position:'absolute',left:14,right:14},empty:{flex:1,alignItems:'center',justifyContent:'center',paddingBottom:80},emptyTitle:{fontFamily:'Inter_700Bold',fontSize:17,marginTop:14},emptyText:{fontFamily:'Inter_400Regular',fontSize:12,marginTop:6}});

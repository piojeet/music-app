import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
export default function Splash(){const c=useColors();useEffect(()=>{const timer=setTimeout(()=>router.replace('/onboarding/1' as never),1100);return()=>clearTimeout(timer)},[]);return <Pressable onPress={()=>router.replace('/onboarding/1' as never)} style={[styles.screen,{backgroundColor:c.background}]}><View style={[styles.icon,{borderColor:c.gold}]}><Feather name="music" size={40} color={c.gold}/></View><Text style={[styles.name,{color:c.foreground}]}>PlayTune</Text><Text style={[styles.tag,{color:c.mutedForeground}]}>Your music. Your way.</Text></Pressable>};const styles=StyleSheet.create({screen:{flex:1,alignItems:'center',justifyContent:'center'},icon:{width:84,height:84,borderRadius:22,borderWidth:1,alignItems:'center',justifyContent:'center',marginBottom:20},name:{fontFamily:'Inter_700Bold',fontSize:30,letterSpacing:-1},tag:{fontFamily:'Inter_400Regular',fontSize:13,marginTop:7}});

import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
export default function Otp() { const { email = "" } = useLocalSearchParams<{ email: string }>(), { verifyOtp } = useAuth(); const [otp, setOtp] = useState(""); const submit = async () => { await verifyOtp(email, otp); router.replace("/(tabs)"); }; return <View><Text>Verify {email}</Text><TextInput keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} /><Pressable onPress={submit}><Text>Verify</Text></Pressable></View>; }

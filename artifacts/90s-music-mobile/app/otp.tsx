import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Otp() {
  const { email = "" } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code from your email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await verifyOtp(email, otp);
      router.replace("/(tabs)");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      await resendOtp(email);
      setOtp("");
      setError("A new verification code was sent to your email.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return <View style={styles.screen}>
    <Text style={styles.title}>Verify your email</Text>
    <Text style={styles.sub}>Enter the 6-digit code sent to {email}.</Text>
    <TextInput keyboardType="number-pad" maxLength={6} value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, ""))} style={styles.input} placeholder="000000" />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable disabled={busy || resending} onPress={submit} style={styles.primary}><Text style={styles.primaryText}>{busy ? "Verifying..." : "Verify"}</Text></Pressable>
    <Pressable disabled={busy || resending} onPress={resend} style={styles.secondary}><Text style={styles.secondaryText}>{resending ? "Sending code..." : "Resend code"}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: "center", padding: 26, gap: 14, backgroundColor: "#09090b" }, title: { color: "#fff", fontSize: 28, fontWeight: "700" }, sub: { color: "#a1a1aa", lineHeight: 20 }, input: { height: 54, borderWidth: 1, borderColor: "#3f3f46", borderRadius: 12, color: "#fff", fontSize: 20, letterSpacing: 8, paddingHorizontal: 18 }, error: { color: "#f87171", lineHeight: 20 }, primary: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#e7c778" }, primaryText: { color: "#17120b", fontWeight: "700" }, secondary: { height: 48, alignItems: "center", justifyContent: "center" }, secondaryText: { color: "#e7c778", fontWeight: "600" } });

import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const POLL_INTERVAL = 4000; // ms between verification checks

export default function Otp() {
  const { email = "" } = useLocalSearchParams<{ email: string }>();
  const { checkEmailVerification, resendVerification } = useAuth();
  const c = useColors();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ---------- Poll until the email is verified ---------------------- */
  const poll = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        if (timerRef.current) clearInterval(timerRef.current);
        router.replace("/(tabs)");
      }
    } catch {
      setError("Unable to check verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  }, [checkEmailVerification]);

  // Poll automatically every few seconds while the screen is mounted.
  useEffect(() => {
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [poll]);

  /* ---------- Manual "I've verified" tap --------------------------- */
  const handleManualCheck = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSuccess("");
    await poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL);
  }, [poll]);

  /* ---------- Resend verification email via context ---------------- */
  const resend = useCallback(async () => {
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await resendVerification();
      setSuccess("A new verification email has been sent. Check your inbox (and spam folder).")
      // Start 60s cooldown to prevent spam
      setResendCooldown(60);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to resend the email.";
      setError(msg);
    } finally {
      setResending(false);
    }
  }, [resendVerification]);

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.foreground }]}>
        Verify your email
      </Text>
      <Text style={[styles.sub, { color: c.mutedForeground }]}>
        We sent a verification link to{' '}
        <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>
          {email}
        </Text>
        .{' '}Open the email and tap the link, then come back here.
      </Text>

      {error ? (
        <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>
      ) : null}

      {success ? (
        <Text style={[styles.success, { color: '#22c55e' }]}>{success}</Text>
      ) : null}

      <Pressable
        disabled={checking}
        onPress={handleManualCheck}
        style={[styles.primary, { backgroundColor: c.gold }]}
      >
        {checking ? (
          <ActivityIndicator color="#17120b" />
        ) : (
          <Text style={styles.primaryText}>I've verified — continue</Text>
        )}
      </Pressable>

      <Pressable
        disabled={resending || resendCooldown > 0}
        onPress={resend}
        style={[styles.secondary, { opacity: resendCooldown > 0 ? 0.5 : 1 }]}
      >
        <Text style={[styles.secondaryText, { color: c.gold }]}>
          {resending
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend verification email"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/login")}
        style={styles.secondary}
      >
        <Text style={[styles.secondaryText, { color: c.mutedForeground }]}>
          Back to Login
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 26, gap: 14 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  sub: { lineHeight: 22, fontFamily: "Inter_400Regular" },
  error: { lineHeight: 20, fontFamily: "Inter_400Regular" },
  success: { lineHeight: 20, fontFamily: "Inter_400Regular" },
  primary: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryText: { color: "#17120b", fontFamily: "Inter_700Bold" },
  secondary: { height: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontFamily: "Inter_600SemiBold" },
});

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
  const { checkEmailVerification } = useAuth();
  const c = useColors();

  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---------- Poll until the email is verified ---------------------- */
  const poll = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        router.replace("/(tabs)");
      } else {
        setError("Email not verified yet — check your inbox and tap the link.");
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
    };
  }, [poll]);

  /* ---------- Manual "I've verified" tap --------------------------- */
  const handleManualCheck = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await poll();
    // Restart polling if still unverified.
    timerRef.current = setInterval(poll, POLL_INTERVAL);
  }, [poll]);

  /* ---------- Simulated resend (re-sends via Firebase) -------------- */
  const resend = useCallback(async () => {
    setResending(true);
    setError("");
    try {
      const { sendEmailVerification } = await import("firebase/auth");
      const { auth: getAuth } = await import("@/lib/firebase");
      const fbUser = getAuth().currentUser;
      if (fbUser) {
        await sendEmailVerification(fbUser);
        setError("A new verification email was sent to your inbox.");
      } else {
        setError("No active session. Please sign up again.");
      }
    } catch {
      setError("Unable to resend the email. Please try again.");
    } finally {
      setResending(false);
    }
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.foreground }]}>
        Verify your email
      </Text>
      <Text style={[styles.sub, { color: c.mutedForeground }]}>
        We sent a verification link to {email}. Open the email and tap the link,
        then come back here.
      </Text>

      {error ? (
        <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>
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
        disabled={resending}
        onPress={resend}
        style={styles.secondary}
      >
        <Text style={[styles.secondaryText, { color: c.gold }]}>
          {resending ? "Sending..." : "Resend verification email"}
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

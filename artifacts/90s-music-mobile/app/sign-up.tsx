import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();
type GoogleConfig = { androidClientId?: string; webClientId?: string };
const appConfig = Constants.expoConfig?.extra as { googleAndroidClientId?: string; googleWebClientId?: string } | undefined;
const googleConfig: GoogleConfig = { androidClientId: appConfig?.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, webClientId: appConfig?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID };
const hasGoogleConfig = Boolean(googleConfig.androidClientId && googleConfig.webClientId);

export default function SignUp() {
  const c = useColors(), insets = useSafeAreaInsets(), { signup } = useAuth();
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const submit = async () => { if (!name || !email || !password || password !== confirm) { setError("Enter your details and matching passwords."); return; } setBusy(true); setError(""); try { await signup(name, email, password); router.replace({ pathname: "/otp", params: { email } }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create your account."); } finally { setBusy(false); } };
  return <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={[styles.screen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 26 }]}>
    <Pressable onPress={() => router.back()}><Feather name="chevron-left" color={c.gold} size={29} /></Pressable>
    <View style={styles.brand}><Feather name="music" size={31} color={c.gold} /><Text style={[styles.brandName, { color: c.foreground }]}>Play<Text style={{ color: c.gold }}>Tune</Text></Text><Text style={[styles.tag, { color: c.mutedForeground }]}>Your music. <Text style={{ color: c.gold }}>Your way.</Text></Text></View>
    <Text style={[styles.title, { color: c.foreground }]}>Create Account</Text><Text style={[styles.sub, { color: c.mutedForeground }]}>Sign up to start listening to your music.</Text>
    <View style={styles.form}>
      <Input c={c} value={name} onChangeText={setName} placeholder="Enter your full name" icon="user" />
      <Input c={c} value={email} onChangeText={setEmail} placeholder="Enter your email address" icon="mail" keyboardType="email-address" autoCapitalize="none" />
      <Input c={c} value={password} onChangeText={setPassword} placeholder="Create a password" icon="lock" secureTextEntry />
      <Input c={c} value={confirm} onChangeText={setConfirm} placeholder="Confirm your password" icon="lock" secureTextEntry />
      {error ? <Text style={{ color: c.destructive, fontSize: 11 }}>{error}</Text> : null}
      <Text style={[styles.terms, { color: c.mutedForeground }]}>● I agree to the <Text style={{ color: c.gold }}>Terms of Use</Text> and <Text style={{ color: c.gold }}>Privacy Policy</Text></Text>
      <Pressable disabled={busy} onPress={submit} style={[styles.primary, { backgroundColor: c.gold }]}><Text style={styles.primaryText}>{busy ? "Creating account..." : "Sign Up"}</Text></Pressable>
      <Text style={[styles.or, { color: c.mutedForeground }]}>or continue with</Text>
      {hasGoogleConfig ? <GoogleSignUpButton c={c} disabled={busy} onError={setError} /> : <Social c={c} icon="google" label="Google sign-in is not configured" onPress={() => setError("Google sign-in is not configured. Restart Expo after adding the Google client IDs.")} />}
      <Social c={c} icon="apple" label="Continue with Apple" onPress={() => setError("Apple sign-in is not available yet.")} />
      <Text style={[styles.login, { color: c.mutedForeground }]}>Already have an account? <Text onPress={() => router.replace("/login")} style={{ color: c.gold }}>Log in</Text></Text>
    </View>
  </ScrollView>;
}

function GoogleSignUpButton({ c, disabled, onError }: { c: ReturnType<typeof useColors>; disabled: boolean; onError: (message: string) => void }) {
  const { loginWithGoogle } = useAuth(); const [busy, setBusy] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleConfig as Required<GoogleConfig>);
  useEffect(() => { if (!response) return; if (response.type !== "success") { if (response.type === "error") onError("Google sign-in failed. Please try again."); setBusy(false); return; } const idToken = response.params.id_token ?? response.authentication?.idToken; if (!idToken) { onError("Google did not return an identity token. Please try again."); setBusy(false); return; } void loginWithGoogle(idToken).then(() => router.replace("/(tabs)")).catch((cause) => onError(cause instanceof Error ? cause.message : "Unable to sign in with Google.")).finally(() => setBusy(false)); }, [loginWithGoogle, onError, response]);
  return <Social c={c} icon="google" label={busy ? "Signing in..." : "Continue with Google"} disabled={disabled || busy || !request} onPress={() => { onError(""); setBusy(true); void promptAsync().catch((cause) => { onError(cause instanceof Error ? cause.message : "Unable to open Google sign-in."); setBusy(false); }); }} />;
}

function Input({ c, icon, ...props }: any) { return <View style={[styles.input, { borderColor: c.border, backgroundColor: c.input }]}><Feather name={icon} size={20} color={c.gold} /><TextInput {...props} placeholderTextColor={c.mutedForeground} style={[styles.field, { color: c.foreground }]} /></View>; }
function Social({ c, icon, label, onPress, disabled }: { c: any; icon: "google" | "apple"; label: string; onPress: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.social, { borderColor: c.border, opacity: disabled ? 0.6 : 1 }]}><Text style={[styles.socialMark, { color: c.gold }]}>{icon === "google" ? "G" : "●"}</Text><Text style={[styles.socialText, { color: c.foreground }]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ screen: { paddingHorizontal: 25 }, brand: { alignItems: "center", marginTop: 12 }, brandName: { fontFamily: "Inter_700Bold", fontSize: 29, marginTop: 7 }, tag: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3 }, title: { fontFamily: "Inter_700Bold", fontSize: 27, marginTop: 34 }, sub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 7 }, form: { gap: 13, marginTop: 25 }, input: { height: 58, borderRadius: 13, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 17, gap: 13 }, field: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" }, terms: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 17 }, primary: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }, primaryText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#17120b" }, or: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 11, marginVertical: 3 }, social: { height: 51, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12 }, socialMark: { fontFamily: "Inter_700Bold", fontSize: 20 }, socialText: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, login: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 13 } });

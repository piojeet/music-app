import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();
type GoogleConfig = { androidClientId?: string; webClientId?: string };
const config = Constants.expoConfig?.extra as { googleAndroidClientId?: string; googleWebClientId?: string } | undefined;
const googleConfig: GoogleConfig = { androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || config?.googleAndroidClientId, webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || config?.googleWebClientId };
// Web needs a registered browser URL. Android uses Expo's provider default,
// which is derived from the installed app package and Android OAuth client.
const googleRedirectUri = Platform.OS === "web" ? AuthSession.makeRedirectUri() : undefined;
const hasGoogleConfig = Boolean(googleConfig.androidClientId && googleConfig.webClientId);

export default function Login() {
  const c = useColors(), { login } = useAuth();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); setError(""); try { const result = await login(email, password); if (result.verificationRequired) router.replace({ pathname: "/otp", params: { email } }); } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in"); } finally { setBusy(false); } };
  return <View style={[s.screen, { backgroundColor: c.background }]}><Text style={[s.title, { color: c.foreground }]}>Welcome Back</Text><Text style={[s.sub, { color: c.mutedForeground }]}>Log in to continue listening.</Text><TextInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={c.mutedForeground} style={[s.input, { color: c.foreground, backgroundColor: c.input, borderColor: c.border }]} /><TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={c.mutedForeground} style={[s.input, { color: c.foreground, backgroundColor: c.input, borderColor: c.border }]} />{error ? <Text style={{ color: c.destructive }}>{error}</Text> : null}<Pressable onPress={submit} disabled={busy} style={[s.button, { backgroundColor: c.gold }]}><Text style={s.buttonText}>{busy ? "Signing in..." : "Login"}</Text></Pressable>{hasGoogleConfig ? <ConfiguredGoogleButton c={c} disabled={busy} onError={setError} /> : <Pressable onPress={() => setError("Google sign-in is not configured. Please try again after the app configuration is reloaded.")} style={[s.googleButton, { borderColor: c.border }]}><Text style={[s.googleMark, { color: c.gold }]}>G</Text><Text style={[s.googleText, { color: c.foreground }]}>Continue with Google</Text></Pressable>}<Pressable onPress={() => router.push("/sign-up")}><Text style={[s.switch, { color: c.mutedForeground }]}>New to PlayTune? <Text style={{ color: c.gold }}>Sign up</Text></Text></Pressable></View>;
}

function ConfiguredGoogleButton({ c, disabled, onError }: { c: ReturnType<typeof useColors>; disabled: boolean; onError: (message: string) => void }) {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  // This component only mounts after both client IDs have been confirmed.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ ...googleConfig, ...(googleRedirectUri ? { redirectUri: googleRedirectUri } : {}) });
  useEffect(() => { if (__DEV__ && request?.redirectUri) console.info("[PlayTune Google OAuth] redirect URI:", request.redirectUri); }, [request?.redirectUri]);
  useEffect(() => { if (!response) return; if (response.type === "success") { const idToken = response.params.id_token ?? response.authentication?.idToken; if (!idToken) { onError("Google did not return an identity token. Please try again."); setBusy(false); return; } void loginWithGoogle(idToken).catch((e) => onError(e instanceof Error ? e.message : "Unable to sign in with Google.")).finally(() => setBusy(false)); } else if (response.type === "error") { onError("Google sign-in failed. Please try again."); setBusy(false); } else setBusy(false); }, [response, loginWithGoogle, onError]);
  const signIn = async () => { onError(""); setBusy(true); try { await promptAsync(); } catch (e) { onError(e instanceof Error ? e.message : "Unable to open Google sign-in."); setBusy(false); } };
  return <Pressable onPress={signIn} disabled={disabled || busy || !request} style={[s.googleButton, { borderColor: c.border }]}><Text style={[s.googleMark, { color: c.gold }]}>G</Text><Text style={[s.googleText, { color: c.foreground }]}>{busy ? "Signing in..." : "Continue with Google"}</Text></Pressable>;
}

const s = StyleSheet.create({ screen: { flex: 1, padding: 26, justifyContent: "center", gap: 13 }, title: { fontSize: 28, fontFamily: "Inter_700Bold" }, sub: { marginBottom: 20 }, input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15 }, button: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 }, buttonText: { color: "#17120b", fontFamily: "Inter_700Bold" }, googleButton: { height: 52, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 11 }, googleMark: { fontFamily: "Inter_700Bold", fontSize: 20 }, googleText: { fontFamily: "Inter_600SemiBold" }, switch: { textAlign: "center", marginTop: 12 } });

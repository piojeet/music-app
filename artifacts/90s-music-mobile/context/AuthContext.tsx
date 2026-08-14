import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const runtimeConfig = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
const API_URL = (runtimeConfig?.apiUrl || process.env.EXPO_PUBLIC_API_URL)?.replace(/\/$/, "");
if (!API_URL) console.warn("EXPO_PUBLIC_API_URL is not configured");
const base = API_URL || "";
const accessKey = "playtune_access_token", refreshKey = "playtune_refresh_token", userKey = "playtune_user";

type User = { id: string; name: string; email: string; authProvider: "email" | "google" };
type Auth = { user: User | null; isLoading: boolean; pendingVerificationEmail: string | null; login: (email: string, password: string) => Promise<{ verificationRequired?: boolean }>; signup: (name: string, email: string, password: string) => Promise<void>; verifyOtp: (email: string, otp: string) => Promise<void>; resendOtp: (email: string) => Promise<void>; loginWithGoogle: (idToken: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<Auth | null>(null);

async function request(path: string, options: RequestInit = {}) { if (!base) throw new Error("The app API URL is not configured."); const response = await fetch(`${base}/api/auth${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || "Something went wrong."); return data; }
async function clearSession() { await Promise.allSettled([SecureStore.deleteItemAsync(accessKey), SecureStore.deleteItemAsync(refreshKey), SecureStore.deleteItemAsync(userKey)]); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null), [isLoading, setLoading] = useState(true), [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const save = useCallback(async (data: unknown) => { const session = data as { accessToken?: unknown; refreshToken?: unknown; user?: User }; if (!session.accessToken || !session.refreshToken || !session.user) throw new Error("The server returned an invalid authentication session."); await SecureStore.setItemAsync(accessKey, String(session.accessToken)); await SecureStore.setItemAsync(refreshKey, String(session.refreshToken)); await SecureStore.setItemAsync(userKey, JSON.stringify(session.user)); setUser(session.user); setPendingVerificationEmail(null); }, []);
  useEffect(() => { void (async () => { try { const refreshToken = await SecureStore.getItemAsync(refreshKey); if (!refreshToken) return; await save(await request("/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) })); } catch { await clearSession(); setUser(null); } finally { setLoading(false); } })(); }, [save]);
  const value = useMemo<Auth>(() => ({ user, isLoading, pendingVerificationEmail, signup: async (name, email, password) => { await request("/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }); setPendingVerificationEmail(email.trim().toLowerCase()); }, verifyOtp: async (email, otp) => save(await request("/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) })), resendOtp: async (email) => { await request("/resend-otp", { method: "POST", body: JSON.stringify({ email }) }); setPendingVerificationEmail(email.trim().toLowerCase()); }, login: async (email, password) => { try { await save(await request("/login", { method: "POST", body: JSON.stringify({ email, password }) })); return {}; } catch (error) { if (error instanceof Error && error.message === "Verify your email to continue.") { setPendingVerificationEmail(email.trim().toLowerCase()); return { verificationRequired: true }; } throw error; } }, loginWithGoogle: async (idToken) => save(await request("/google", { method: "POST", body: JSON.stringify({ idToken }) })), logout: async () => { try { const token = await SecureStore.getItemAsync(accessKey); if (token) await request("/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } }); } catch { /* local cleanup is still required */ } finally { await clearSession(); setUser(null); setPendingVerificationEmail(null); } } }), [user, isLoading, pendingVerificationEmail, save]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider"); return context; }

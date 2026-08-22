import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  reload,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth as getAuth } from "@/lib/firebase";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Deep link URL for email verification — points back into the app
const APP_SCHEME = Constants.expoConfig?.scheme?.[0] || "90s-music-mobile";
const EMAIL_ACTION_URL = Platform.OS === "web"
  ? window?.location?.origin || "https://playtune.app"
  : `${APP_SCHEME}://email-verified`;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  authProvider: "email" | "google";
};

type Auth = {
  user: User | null;
  isLoading: boolean;
  firebaseReady: boolean;
  pendingVerificationEmail: string | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ verificationRequired?: boolean }>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

const userKey = "playtune_user";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function firebaseUserToUser(
  fb: FirebaseUser,
  displayName?: string | null,
): User {
  return {
    id: fb.uid,
    name: displayName || fb.email?.split("@")[0] || "User",
    email: fb.email ?? "",
    emailVerified: fb.emailVerified,
    authProvider: fb.providerData.some(
      (p) => p.providerId === GoogleAuthProvider.PROVIDER_ID,
    )
      ? "google"
      : "email",
  };
}

const NOT_CONFIGURED = "Firebase is not configured. Check your .env file.";

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null);

  const firebaseReady = getAuth() !== null;

  // Listen to Firebase auth state changes — only if Firebase is available.
  useEffect(() => {
    const authInstance = getAuth();
    if (!authInstance) {
      // Firebase not configured — finish loading so the app shows login.
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, (fbUser) => {
      if (fbUser) {
        const mapped = firebaseUserToUser(fbUser);
        setUser(mapped);
        SecureStore.setItemAsync(userKey, JSON.stringify(mapped)).catch(() => {});
      } else {
        setUser(null);
        SecureStore.deleteItemAsync(userKey).catch(() => {});
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ---------- Email / password login -------------------------------- */
  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ verificationRequired?: boolean }> => {
      const authInstance = getAuth();
      if (!authInstance) throw new Error(NOT_CONFIGURED);

      const cred = await signInWithEmailAndPassword(authInstance, email, password);
      if (!cred.user.emailVerified) {
        await firebaseSignOut(authInstance);
        setPendingVerificationEmail(email.trim().toLowerCase());
        return { verificationRequired: true };
      }
      setPendingVerificationEmail(null);
      return {};
    },
    [],
  );

  /* ---------- Email / password sign-up ------------------------------ */
  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const authInstance = getAuth();
      if (!authInstance) throw new Error(NOT_CONFIGURED);

      const cred = await createUserWithEmailAndPassword(authInstance, email, password);
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(cred.user, { displayName: name });

      // Send verification email with actionCodeSettings for mobile
      await sendEmailVerification(cred.user, {
        url: EMAIL_ACTION_URL,
        handleCodeInApp: true,
      });
      setPendingVerificationEmail(email.trim().toLowerCase());
    },
    [],
  );

  /* ---------- Resend verification email ----------------------------- */
  const resendVerification = useCallback(async () => {
    const authInstance = getAuth();
    if (!authInstance) throw new Error(NOT_CONFIGURED);
    const fbUser = authInstance.currentUser;
    if (!fbUser) throw new Error("No active session. Please sign up again.");
    await sendEmailVerification(fbUser, {
      url: EMAIL_ACTION_URL,
      handleCodeInApp: true,
    });
  }, []);

  /* ---------- Check email verification status ----------------------- */
  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    const authInstance = getAuth();
    if (!authInstance) return false;

    const fbUser = authInstance.currentUser;
    if (!fbUser) return false;
    await reload(fbUser);
    const verified = fbUser.emailVerified;
    if (verified) {
      setPendingVerificationEmail(null);
      setUser(firebaseUserToUser(fbUser));
    }
    return verified;
  }, []);

  /* ---------- Google sign-in ---------------------------------------- */
  const loginWithGoogle = useCallback(async (idToken: string) => {
    const authInstance = getAuth();
    if (!authInstance) throw new Error(NOT_CONFIGURED);

    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(authInstance, credential);
    setUser(firebaseUserToUser(cred.user));
    setPendingVerificationEmail(null);
  }, []);

  /* ---------- Logout ------------------------------------------------ */
  const logout = useCallback(async () => {
    const authInstance = getAuth();
    if (authInstance) {
      await firebaseSignOut(authInstance).catch(() => {});
    }
    setUser(null);
    setPendingVerificationEmail(null);
    await SecureStore.deleteItemAsync(userKey).catch(() => {});
  }, []);

  /* ---------- Context value ----------------------------------------- */
  const value = useMemo<Auth>(
    () => ({
      user,
      isLoading,
      firebaseReady,
      pendingVerificationEmail,
      login,
      signup,
      resendVerification,
      checkEmailVerification,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      isLoading,
      firebaseReady,
      pendingVerificationEmail,
      login,
      signup,
      resendVerification,
      checkEmailVerification,
      loginWithGoogle,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): Auth {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

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
  pendingVerificationEmail: string | null;
  /** Email / password login. Returns { verificationRequired } when the
   *  account exists but the email hasn't been verified yet. */
  login: (
    email: string,
    password: string,
  ) => Promise<{ verificationRequired?: boolean }>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  /** Re-check whether the current user's email has been verified. */
  checkEmailVerification: () => Promise<boolean>;
  /** Sign in with a Google id_token obtained via expo-auth-session. */
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

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null);

  // Listen to Firebase auth state changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (fbUser) => {
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
      const cred = await signInWithEmailAndPassword(getAuth(), email, password);
      // If email not verified, sign the user back out and ask for verification.
      if (!cred.user.emailVerified) {
        await firebaseSignOut(getAuth());
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
      const cred = await createUserWithEmailAndPassword(getAuth(), email, password);
      // Update the display name on the Firebase user.
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(cred.user, { displayName: name });
      // Send a verification email.
      await sendEmailVerification(cred.user);
      setPendingVerificationEmail(email.trim().toLowerCase());
    },
    [],
  );

  /* ---------- Check email verification status ----------------------- */
  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    const fbUser = getAuth().currentUser;
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
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(getAuth(), credential);
    setUser(firebaseUserToUser(cred.user));
    setPendingVerificationEmail(null);
  }, []);

  /* ---------- Logout ------------------------------------------------ */
  const logout = useCallback(async () => {
    await firebaseSignOut(getAuth()).catch(() => {});
    setUser(null);
    setPendingVerificationEmail(null);
    await SecureStore.deleteItemAsync(userKey).catch(() => {});
  }, []);

  /* ---------- Context value ----------------------------------------- */
  const value = useMemo<Auth>(
    () => ({
      user,
      isLoading,
      pendingVerificationEmail,
      login,
      signup,
      checkEmailVerification,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      isLoading,
      pendingVerificationEmail,
      login,
      signup,
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

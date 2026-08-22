import {
  initializeApp,
  getApps,
  getApp as getFirebaseApp,
  type FirebaseApp,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function app(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getFirebaseApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function auth(): Auth | null {
  if (!isConfigured) return null;
  try {
    if (!_auth) {
      _auth = getAuth(app());
    }
    return _auth;
  } catch {
    return null;
  }
}

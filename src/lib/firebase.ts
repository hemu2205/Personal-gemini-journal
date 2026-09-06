import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  type Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import type { Interaction } from "../types";

// Initialize Firebase App instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if configured
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || "(default)"
);

// Google Sign-In Provider Configuration
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

// Secure Google Authentication Handler
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    if (error?.code === "auth/popup-blocked") {
      throw new Error("Sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab.");
    } else if (error?.code === "auth/cancelled-popup-request" || error?.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled. Please try again.");
    }
    throw new Error(error?.message || "Failed to authenticate with Google. Please try again.");
  }
}

// Sign-Out Handler
export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Real-time listener for user-isolated interactions
export function subscribeToUserInteractions(
  userId: string,
  callback: (interactions: Interaction[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) return () => {};

  // Strictly bound to /users/{userId}/interactions
  const interactionsRef = collection(db, "users", userId, "interactions");
  const q = query(interactionsRef, orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Interaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Interaction;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      callback(items);
    },
    (err) => {
      console.error("Error fetching interactions from Firestore:", err);
      onError(err);
    }
  );
}

// Persist or update an interaction in Firestore
export async function saveInteraction(
  userId: string,
  interaction: Interaction
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to save an interaction.");
  }
  const cleanPayload = sanitizePayload(interaction);
  const docRef = doc(db, "users", userId, "interactions", interaction.id);
  await setDoc(docRef, cleanPayload, { merge: true });
}

// Delete an interaction
export async function removeInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  if (!userId || !interactionId) return;
  const docRef = doc(db, "users", userId, "interactions", interactionId);
  await deleteDoc(docRef);
}

export { onAuthStateChanged };

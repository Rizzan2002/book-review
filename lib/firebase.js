import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// This file initializes the CLIENT-SIDE connection to Firebase
// It uses the public environment variables (NEXT_PUBLIC_)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Initialize Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig);
  // setLogLevel('debug'); // Uncomment for debugging
}

export const auth = getAuth();
export const db = getFirestore();

/**
 * Gets the current user. If no user is signed in,
 * it signs them in anonymously.
 */
export const getAuthenticatedUser = () => {
  return new Promise((resolve, reject) => {
    // Listen for the *next* auth state change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Stop listening
      if (user) {
        resolve(user); // User is already signed in
      } else {
        // No user, so sign in anonymously
        signInAnonymously(auth)
          .then((credential) => {
            resolve(credential.user); // Resolve with the new anonymous user
          })
          .catch((error) => {
            console.error("Anonymous sign-in error", error);
            reject(error);
          });
      }
    });
  });
};
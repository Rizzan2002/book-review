import admin from 'firebase-admin';

// This file initializes the SERVER-SIDE connection to Firebase
// It uses our secret environment variables
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // This 'replace' is CRITICAL.
        // It un-escapes the newline characters (\n) from the .env.local file
        // and turns them into real newlines for the private key.
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

// This is our server-side database instance
export const db = admin.firestore();
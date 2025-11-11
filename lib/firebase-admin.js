// --- NEW CACHE-BUSTING LOG ---
console.log('[FORCE RE-BUILD V7] --- Starting lib/firebase-admin.js');
// --- END CACHE-BUSTING LOG ---

import admin from 'firebase-admin';

// --- DEBUGGING LOGS ---
console.log('[DEBUG V7] Checking Vercel Environment Variables...');
console.log(`[DEBUG V7] FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '******' : 'NOT FOUND (undefined)'}`);
console.log(`[DEBUG V7] FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '******' : 'NOT FOUND (undefined)'}`);
console.log(`[DEBUG V7] FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '******' : 'NOT FOUND (undefined)'}`);
// --- END DEBUGGING LOGS ---

/**
 * This function initializes the Firebase Admin app.
 * It's designed to be run *only once*.
 */
function initializeAdminApp() {
  console.log('[DEBUG V7] Initializing new Firebase admin app...');
  try {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID is not defined. Check Vercel env variables.");
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("FIREBASE_CLIENT_EMAIL is not defined. Check Vercel env variables.");
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("FIREBASE_PRIVATE_KEY is not defined. Check Vercel env variables.");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    
    console.log('[DEBUG V7] Firebase admin initialized successfully.');

  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
    throw new Error(`Firebase admin init failed: ${error.message}`);
  }
}

/**
 * This is our new "getter" function.
 * It checks if the app is initialized, and if not,
 * it initializes it. It then *always* returns a
 * valid firestore instance.
 */
export function getAdminDb() {
  if (!admin.apps.length) {
    initializeAdminApp();
  }
  return admin.firestore();
}
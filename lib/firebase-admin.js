// --- NEW CACHE-BUSTING LOG ---
console.log('[FORCE RE-BUILD V8] --- Starting lib/firebase-admin.js');
// --- END CACHE-BUSTING LOG ---

import admin from 'firebase-admin';

// --- DEBUGGING LOGS ---
console.log('[DEBUG V8] Checking Vercel Environment Variables...');
console.log(`[DEBUG V8] FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '******' : 'NOT FOUND (undefined)'}`);
console.log(`[DEBUG V8] FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '******' : 'NOT FOUND (undefined)'}`);
console.log(`[DEBUG V8] FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '******' : 'NOT FOUND (undefined)'}`);
// --- END DEBUGGING LOGS ---

// We will cache our db instance here.
let db;

/**
 * This is our new "getter" function.
 * It's now "concurrency-safe".
 */
export function getAdminDb() {
  // 1. If we already have a cached, valid db, return it immediately.
  if (db) {
    return db;
  }

  // 2. If we don't, we must initialize.
  if (!admin.apps.length) {
    console.log('[DEBUG V8] No admin apps found. Initializing new app...');
    try {
      // We add these checks to fail loudly if variables are missing
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
          // This 'replace' is CRITICAL.
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      
      console.log('[DEBUG V8] Firebase admin initialized successfully.');

    } catch (error) {
      console.error('Firebase admin initialization error', error.stack);
      // Re-throw the error to make the Vercel build fail with a clear message
      throw new Error(`Firebase admin init failed: ${error.message}`);
    }
  } else {
     console.log('[DEBUG V8] Using existing Firebase admin app.');
  }

  // 3. --- THIS IS THE FIX ---
  // Now that we *know* an app exists (either new or existing),
  // get the firestore instance from the *default app*
  // and **cache it in our 'db' variable.**
  db = admin.app().firestore();
  
  // 4. Return the cached instance.
  return db;
}
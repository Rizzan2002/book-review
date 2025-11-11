import admin from 'firebase-admin';

// --- NEW DEBUGGING LOGS ---
// This will run first and show us what Vercel is *really* seeing.
console.log('[DEBUG] Checking Vercel Environment Variables...');
console.log(`[DEBUG] FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '******' : 'NOT FOUND (undefined)'}`);
console.log(`[DEBUG] FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '******' : 'NOT FOUND (undefined)'}`);
console.log(`[DEBUG] FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '******' : 'NOT FOUND (undefined)'}`);
// --- END DEBUGGING LOGS ---

let db;

// This file initializes the SERVER-SIDE connection to Firebase
// It uses our secret environment variables
if (!admin.apps.length) {
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
    
    // Only assign db if initialization was successful
    db = admin.firestore();

  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
    // Re-throw the error to make the Vercel build fail with a clear message
    throw new Error(`Firebase admin init failed: ${error.message}`);
  }
} else {
  // App was already initialized, just get the existing instance
  db = admin.app().firestore();
}

// Export the (hopefully) initialized db
export { db };
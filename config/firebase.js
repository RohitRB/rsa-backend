// config/firebase.js (UPDATED - Critical Change)
import admin from 'firebase-admin';

let db; // Declare db outside to be accessible after initialization

// This function will initialize the Firebase Admin SDK
const connectFirebase = () => {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please add it to Render.');
      process.exit(1);
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized successfully.');

    // Assign the Firestore instance to the 'db' variable
    db = admin.firestore();

  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('Attempted to parse:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 200) + '...' : ' (No value found)');
    }
    process.exit(1);
  }
};

// Call connectFirebase immediately to initialize and set 'db'
connectFirebase();

// Export the 'db' instance directly
export default db; // <-- CHANGED: Export the initialized Firestore instance
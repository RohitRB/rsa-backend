// config/firebase.js
import admin from 'firebase-admin';

// This function will initialize the Firebase Admin SDK
const connectFirebase = () => {
  try {
    // Ensure the environment variable is loaded. dotenv.config() in index.js usually handles this.
    // If it's not set, this will log an error and exit.
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please add it to Render.');
      process.exit(1); // Exit if the key is missing
    }

    // Parse the JSON string from the environment variable into a JavaScript object
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    // Initialize the Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
      // For Firestore, a databaseURL is typically not explicitly needed unless you're also using Realtime Database
    });

    console.log('✅ Firebase Admin SDK initialized successfully.');

    // Return the Firestore instance so you can use it in your routes
    return admin.firestore();

  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    // Log the actual content that caused the parse error if it's a JSON issue
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('Attempted to parse:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 200) + '...' : ' (No value found)');
    }
    process.exit(1); // Exit if initialization fails
  }
};

export default connectFirebase;
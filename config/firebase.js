// config/firebase.js (UPDATED - Supports both local file and environment variable)
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null; // Declare db outside to be accessible after initialization

// This function will initialize the Firebase Admin SDK
const connectFirebase = () => {
  try {
    let serviceAccount;

    // Check if environment variable is set (for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('Using Firebase service account from environment variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } 
    // Check if local JSON file exists (for development)
    else {
      const serviceAccountPath = join(__dirname, '..', 'kalyan-rsa-backend-firebase-adminsdk-fbsvc-af5b9f8c2e.json');
      if (fs.existsSync(serviceAccountPath)) {
        console.log('Using Firebase service account from local JSON file');
        const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountFile);
      } else {
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set and local JSON file not found.');
        console.error('Please either:');
        console.error('1. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable, or');
        console.error('2. Place the Firebase service account JSON file in the project root');
        console.error('The app will start but database features will be disabled.');
        // Don't exit - let the app start for health checks
        return;
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized successfully.');

    // Assign the Firestore instance to the 'db' variable
    db = admin.firestore();

  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('JSON parsing error. Please check your service account configuration.');
    }
    console.error('The app will start but database features will be disabled.');
    // Don't exit - let the app start for health checks
  }
};

// Call connectFirebase immediately to initialize and set 'db'
connectFirebase();

// Export the 'db' instance directly
export default db;
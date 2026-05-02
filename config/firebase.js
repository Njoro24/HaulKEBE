import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db = null;

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  
  if (serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    db = admin.database();
  } else {
    console.warn('Firebase not configured - skipping initialization');
  }
} catch (err) {
  console.warn('Firebase initialization skipped:', err.message);
}

export { db };
export default admin;

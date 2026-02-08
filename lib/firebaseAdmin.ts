import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function init() {
  if (getApps().length) return getApps()[0]!;
  // Use application default credentials on Cloud Run/Functions, or service account JSON locally.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp();
  }
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!svc) {
    // Still allow build without creds; runtime will fail if routes needing admin are hit.
    return initializeApp();
  }
  return initializeApp({
    credential: cert(JSON.parse(svc)),
  });
}

export const adminApp = init();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

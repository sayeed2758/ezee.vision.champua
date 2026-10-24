// Paste the web-app config copied from Firebase Console > Project settings > Your apps.
// These values are public identifiers, not server secrets. Protect data with the included rules.
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY_HERE',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'PASTE_MESSAGING_SENDER_ID_HERE',
  appId: 'PASTE_APP_ID_HERE'
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PASTE_') &&
  firebaseConfig.projectId && !firebaseConfig.projectId.includes('YOUR_') &&
  firebaseConfig.storageBucket && !firebaseConfig.storageBucket.includes('YOUR_') &&
  firebaseConfig.authDomain && !firebaseConfig.authDomain.includes('YOUR_') &&
  firebaseConfig.appId && !firebaseConfig.appId.includes('PASTE_')
);

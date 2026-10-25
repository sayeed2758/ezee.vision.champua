export const firebaseConfig = {
apiKey: "AIzaSyBwAboUjIi-j9xUkWia-bIKnkrC92zxgZ0",
authDomain: "ezee-vision-champua-20fe1.firebaseapp.com",
projectId: "ezee-vision-champua-20fe1",
storageBucket: "ezee-vision-champua-20fe1.firebasestorage.app",
messagingSenderId: "1093104020553",
appId: "1:1093104020553:web:e17d8fc0e0b87a9b562398"
};

export const isFirebaseConfigured = Boolean(
firebaseConfig.apiKey &&
firebaseConfig.authDomain &&
firebaseConfig.projectId &&
firebaseConfig.storageBucket &&
firebaseConfig.messagingSenderId &&
firebaseConfig.appId &&
!firebaseConfig.apiKey.startsWith("PASTE_")
);

export default firebaseConfig;

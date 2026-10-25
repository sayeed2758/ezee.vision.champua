import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
apiKey: "AIzaSyBwAboUjIi-j9xUkWia-bIKnkrC92zxgZ0",
authDomain: "ezee-vision-champua-20fe1.firebaseapp.com",
projectId: "ezee-vision-champua-20fe1",
storageBucket: "ezee-vision-champua-20fe1.firebasestorage.app",
messagingSenderId: "1093104020553",
appId: "1:1093104020553:web:e17d8fc0e0b87a9b562398"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

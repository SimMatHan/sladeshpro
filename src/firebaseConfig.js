// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage"; // Add storage

const firebaseConfig = {
  apiKey: "AIzaSyA6GJCKDt0IsysWBtv6QBJbXchr2DsZ6ZE",
  authDomain: "sladeshpro.firebaseapp.com",
  projectId: "sladeshpro",
  storageBucket: "sladeshpro.firebasestorage.app",
  messagingSenderId: "818619367245",
  appId: "1:818619367245:web:44d4df20d2201ba50d4104",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app); // Export storage

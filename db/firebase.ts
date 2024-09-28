// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Optional, if you're using Firebase Auth
import { getFirestore } from "firebase/firestore"; // Optional, if you're using Firestore
import { getStorage } from "firebase/storage"; // Optional, if you're using Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyCmYTNaiBgEOS81V0at6cRwrh4lvGvloM4",
  authDomain: "video-conferencing-ba13a.firebaseapp.com",
  projectId: "video-conferencing-ba13a",
  storageBucket: "video-conferencing-ba13a.appspot.com",
  messagingSenderId: "728875728379",
  appId: "1:728875728379:web:023420ff5fa065ffc0df5e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (optional, depending on your needs)
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBzF9SW9jWvoZL3ke5tyllbUIiTf9BOTso",
  authDomain: "kec-assign.firebaseapp.com",
  projectId: "kec-assign",
  storageBucket: "kec-assign.firebasestorage.app",
  messagingSenderId: "467052520869",
  appId: "1:467052520869:web:f35a8a19e41f69453b344c344c",
  measurementId: "G-XTZK6JMZXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

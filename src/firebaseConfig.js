// Import the necessary functions and services from the Firebase SDK
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzS--RudBcb0X3GipS-bIv3pQ8Zq17oKM",
  authDomain: "aste-1d2f1.firebaseapp.com",
  projectId: "aste-1d2f1",
  storageBucket: "aste-1d2f1.appspot.com",
  messagingSenderId: "704876655076",
  appId: "1:704876655076:web:294160a151f042228857f1",
  measurementId: "G-KNM458R3BE"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };

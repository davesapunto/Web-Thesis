// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBVqxR6mbSzwz0hRMpuYvg3bTJ85IGcYw",
  authDomain: "cloud-pastries-98df5.firebaseapp.com",
  projectId: "cloud-pastries-98df5",
  storageBucket: "cloud-pastries-98df5.appspot.com",
  messagingSenderId: "291294796685",
  appId: "1:291294796685:web:7539731e2706dd43267bc4",
  measurementId: "G-DXGRKKSWYZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const initFirebase = () => {
  return app;
}

export const db = getFirestore(app);
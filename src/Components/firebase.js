import firebase from 'firebase/app';
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import 'firebase/auth';

  
  

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDi4JBfJPfBUXutm38DqUrjg2s8Q8xi3ls",
    authDomain: "primer-53a41.firebaseapp.com",
    projectId: "primer-53a41",
    storageBucket: "primer-53a41.appspot.com",
    messagingSenderId: "785639513587",
    appId: "1:785639513587:web:8d6c676586571a19228686",
    measurementId: "G-J8SZNH25ZJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
  
  
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
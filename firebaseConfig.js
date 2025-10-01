import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBsFGDEOyYDSt6P3KioVIUbdZ5sWpbSxgE",
  authDomain: "tourism-c262b.firebaseapp.com",
  projectId: "tourism-c262b",
  storageBucket: "tourism-c262b.appspot.com",
  messagingSenderId: "859541725168",
  appId: "1:859541725168:android:6c6a744ee182f481cf8735",
};

export const firebaseApp = initializeApp(firebaseConfig);

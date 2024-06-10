import { getStripePayments } from "@stripe/firestore-stripe-payments";
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyB0YAFU4WQ7ex8uJ0e1Sw2l68IC4tjzwWQ",
    authDomain: "nonotes-7bd24.firebaseapp.com",
    projectId: "nonotes-7bd24",
    storageBucket: "nonotes-7bd24.appspot.com",
    messagingSenderId: "193959438118",
    appId: "1:193959438118:web:eca4f99942d37ad12f43e7",
    measurementId: "G-V68LMBMGW3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const functions = getFunctions(app);
const db = getFirestore(app);
const payments = getStripePayments(app, {
    productsCollection: "products",
    customersCollection: "customers",
});

export { auth, provider, functions, db, payments };
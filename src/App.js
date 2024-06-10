import React, { useState, useEffect, useRef } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithRedirect, signOut, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from './context/AuthProvider';
import createCustomer from './function/stripeHandler';
import { PRICE_ID, SECRET_KEY } from './config/stripe';

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
const db = getFirestore(app);


const stripe = require('stripe');
const stripeClient = stripe(SECRET_KEY);


const provider = new GoogleAuthProvider();
const auth = getAuth();

function App() {
  const [firstTextboxValue, setFirstTextboxValue] = useState('55 year old with back pain');
  const [secondTextboxValue, setSecondTextboxValue] = useState('');
  const [userValue, setUserValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(false);
  const textareaRef = useRef(null);
  const { user } = useAuth();
  const [subscriptionData,setSubscriptionData]=useState({});
  console.log({subscriptionStatus})
  //functions
  async function updateUserSubscription(userValue, fieldName, updatedValue) {
    // Query Firestore collection to find the user document based on email
    const q = query(collection(db, 'customers'), where('email', '==', userValue.email));

    try {
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User data exists, update the document
        querySnapshot.forEach(async (userDoc) => {
          const userDocRef = doc(db, 'customers', userDoc.id);

          // Update the customerId and subscriptionId fields
          await updateDoc(userDocRef, {
            [fieldName]: updatedValue,
            
          });

          console.log('User data updated with new customerId and subscriptionId');
        });
      } else {
        console.log('No user data found for the provided email');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }
  //

  useEffect(() => {
    const adjustHeight = () => {
      setUserValue(user);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'; // Reset height to recalculate
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
      }
    };

    adjustHeight();
  }, [secondTextboxValue, user]);

  useEffect(() => {
    if (userValue) {
      checkSubscriptionStatus();
    }
  }, [userValue]);

  const checkSubscriptionStatus = async () => {
    if (!userValue) return;
    const q = query(collection(db, 'users', userValue.uid, 'subscriptions'), where('status', 'in', ['active', 'trialing']));
    const querySnapshot = await getDocs(q);
    setSubscriptionStatus(!querySnapshot.empty);
  };

  const handleSignIn = () => {
    signInWithRedirect(auth, provider);
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setUserValue(null);
      setSubscriptionStatus(false);
    }).catch((error) => {
      console.log("Couldn't sign out");
    });
  };

  const handleStartSubscription = async () => {

    // Query Firestore collection to check if user data exists
    const q = query(collection(db, 'customers'), where('email', '==', userValue.email));

    try {
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User data exists, log it to the console
        querySnapshot.forEach(doc => {
          console.log('User data:', doc.data());
        });
        const customer = await createCustomer(stripeClient,userValue.email);
        await updateUserSubscription(userValue,'customerId',customer.id);

        const updated = query(collection(db, 'customers'), where('email', '==', userValue.email));
        const querySnapshotUpdated = await getDocs(updated);
        querySnapshotUpdated.forEach( async(doc) => {
          console.log('User data updated:', doc.data());

          const userData = doc.data();
          const email = userData.email
          const customerId= userData.customerId;


          //stripe code
          const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
              price: PRICE_ID,
              quantity: 1,
            }],
            customer: customerId,
            success_url: window.location.origin,
            cancel_url: window.location.origin,
          });

          console.log(session);
          
          await updateUserSubscription(userValue, 'sessionId', session.id);
          await updateUserSubscription(userValue, 'subscriptionId', '');

          const updated = query(collection(db, 'customers'), where('email', '==', userValue.email));
          const querySnapshotUpdated = await getDocs(updated);
          querySnapshotUpdated.forEach(async (doc) => {
            console.log('User data updated with sessionId:', doc.data());
            setTimeout(() => {
              window.location.href = session.url;
            }, 2000);
          })

        });

      } else {
        // User data does not exist, add it to the database
        const userData = {
          email: userValue.email,
          customerId: '',
          subscriptionId: ''
        };

        // Add user data to Firestore
        const docRef = await addDoc(collection(db, 'customers'), userData);
        //update data
        const customer = await createCustomer(stripeClient, userValue.email);
        await updateUserSubscription(userValue, 'customerId', customer.id)

        const updated = query(collection(db, 'customers'), where('email', '==', userValue.email));
        const querySnapshotUpdated = await getDocs(updated);
        querySnapshotUpdated.forEach(async (doc) => {
          console.log('User data added:', doc.data());

          //stripe code

          const userData = doc.data();
          const email = userData.email
          const customerId = userData.customerId;


          //stripe code
          const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
              price: PRICE_ID,
              quantity: 1,
            }],
            customer: customerId,
            success_url: window.location.origin,
            cancel_url: window.location.origin,
          });

          console.log(session);

          await updateUserSubscription(userValue, 'sessionId', session.id);
          await updateUserSubscription(userValue, 'subscriptionId', '');

          const updated = query(collection(db, 'customers'), where('email', '==', userValue.email));
          const querySnapshotUpdated = await getDocs(updated);
          querySnapshotUpdated.forEach(async (doc) => {
            console.log('User data updated with sessionId:', doc.data());
            setTimeout(() => {
              window.location.href = session.url;
            }, 2000);
          })



        });

      }
    } catch (error) {
      console.error('Error checking user data:', error);
    }

  };

  useEffect(() => {
    const fetchUpdatedUserData = async () => {
      if (!userValue?.email) return;

      const updated = query(collection(db, 'customers'), where('email', '==', userValue.email));

      try {
        const querySnapshotUpdated = await getDocs(updated);

        for (const doc of querySnapshotUpdated.docs) {
          console.log('User data updated with sessionId:', doc?.data());
          const userData = doc?.data();
          if (userData.sessionId) {
            const session = await stripeClient.checkout.sessions.retrieve(userData.sessionId);
            console.log(session);
            if(session.subscription){
             await updateUserSubscription(userValue,'subscriptionId', session.subscription);
             //check subscription status
             try{

               const subscription = await stripeClient.subscriptions.retrieve(
                 session.subscription
               );
               console.log(subscription);
               setSubscriptionStatus(subscription.status);
               setSubscriptionData(subscription);
             }catch(err){
              //no subscription found
               setSubscriptionStatus(false);
             }

            }else{
              setSubscriptionStatus(false);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUpdatedUserData();
  }, [userValue?.email, userValue]);


  const handleClick = async () => {
    console.log("Initialized the webapp");

    setLoading(true);

    // Dummy implementation
    setTimeout(() => {
      setSecondTextboxValue('This is a dummy response.');
      setLoading(false);
    }, 3000);
  };

  const handleMange = async () => {
    try{
      const confirm = window.confirm('Are you sure you want to cancel subscription?');
     if(confirm){
       const subscription = await stripeClient.subscriptions.cancel(
         subscriptionData.id
       );
       await updateUserSubscription(userValue, 'subscriptionId', '');
       await updateUserSubscription(userValue, 'sessionId', '');
       window.alert("Subscription cancelled")
       setTimeout(() => {
         window.location.reload();
       }, 3000);
     }

    }catch(err){
      console.log(err);
    }
  };

  return (
    <div className="App">
    Subscription status {subscriptionStatus ? subscriptionStatus :'Not subscribed'}
      <div className="buttons">
        {userValue ?
          <>
            <h4>Hi {userValue.displayName}!</h4>
            <button className="" onClick={handleSignOut}>
              <span>Sign Out</span>
            </button>
            <button className="" style={{ marginLeft: 10 }} onClick={subscriptionStatus === 'active' ? handleMange : handleStartSubscription}>
              <span>{subscriptionStatus ==='active' ? "End subscription" : "Start Subscription"}</span>
            </button>
           
          </> :
          <button className="" onClick={handleSignIn}>
            <span>Sign In</span>
          </button>
        }
      </div>

      <div className="input-container">
        <h2>Brief Case Description</h2>
        <input
          type="text"
          placeholder="Give us a short description of your Case Description."
          className="text-input"
          value={firstTextboxValue}
          onChange={(e) => setFirstTextboxValue(e.target.value)}
        />
      </div>
      <div className="input-container">
        <h2>Your Full Evaluation</h2>
        <textarea
          placeholder="We'll handle this part!"
          disabled={secondTextboxValue.length === 0}
          className="text-input"
          value={secondTextboxValue}
          onChange={(e) => setSecondTextboxValue(e.target.value)}
          ref={textareaRef}
          style={{ overflow: 'hidden', resize: 'none' }}
        />
      </div>
      <LoadingButton
        className="button-container"
        size="medium"
        onClick={handleClick}
        loading={loading}
        variant="contained"
        color="success"
        disabled={loading || userValue === null || firstTextboxValue.length === 0}>
        <span>
          {userValue === null || firstTextboxValue.length === 0 ?
            firstTextboxValue.length === 0 ? "Describe your case!" : "Sign in"
            : "Let the machine do the work"
          }
        </span>
      </LoadingButton>
      {
        loading ?
          <div className="button-container">
            <span>This may take roughly 30 seconds. Thanks for your patience.</span>
          </div> : <div style={{ height: 100 }} />
      }
    </div>
  );
}

export default App;

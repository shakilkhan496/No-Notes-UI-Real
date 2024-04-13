import React, { useState, useEffect, useRef } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import './App.css'; 
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable }  from 'firebase/functions';
import { getAuth, signInWithRedirect, signOut, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

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
const functions = getFunctions(app);

const provider = new GoogleAuthProvider();
const auth = getAuth();


function App() {
  const [firstTextboxValue, setFirstTextboxValue] = useState('55 year old with back pain');
  const [secondTextboxValue, setSecondTextboxValue] = useState('');
  const [userValue, setUserValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const adjustHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'; // Reset height to recalculate
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
      }
    };

    adjustHeight(); 
  }, [secondTextboxValue]);

  useEffect(() => {
    // setUserValue(auth.currentUser);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        setUserValue(user);
        console.log("user signed in: ", user, "done.");
      } else {
        setUserValue(null);
        console.log("user signed out: ", user, "done.");
      }
    });
  
    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);
  

  const handleSignIn = () => {
    signInWithRedirect(auth, provider)
  }

  const handleSignOut = () => {
    signOut(auth).then(() => {
      // Sign-out successful.
      // setIsSignedIn(false)
      setUserValue(null)
    }).catch((error) => {
      // An error happened.
      console.log("couldnt sign out")
    });
  }

  const handleStripePurchase = () => {

  }

  const handleStripeView = () => {

  }

  const handleClick = async () => {
    console.log("Initialized the webapp")

    setLoading(true);

    const goodbyeWorld = httpsCallable(functions, 'goodbyePain');
    goodbyeWorld({ prompt: firstTextboxValue })
      .then((result) => {
        /** @type {any} */
        const dataResponse = result.data;
        console.log("Firebase response")
        console.log(dataResponse)
        setSecondTextboxValue(dataResponse);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error)
        setLoading(false);
      });
  };

  return (
    <div className="App">
      <div className="buttons">
      {userValue ? 
        <>
          <h4>Hi {userValue.displayName}!</h4>
          <button className="" onClick={handleSignOut}>
            <span>Sign Out</span>
          </button>
        </>  :
        <button className="" onClick={handleSignIn}>
          <span>Sign In</span>
        </button>
      }
      {userValue ? 
        <>
          <button className="" onClick={handleStripeView}>
            <span>View Membership</span>
          </button>
        </>  :
        <button className="" onClick={handleStripePurchase}>
          <span>Buy Membership</span>
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
          { userValue === null || firstTextboxValue.length === 0 ?
            firstTextboxValue.length === 0 ? "Describe your case!" : "Sign in"
           : "Let the machine do the work"
          }
            
        </span>
      </LoadingButton>
      {
        loading ? 
          <div className="button-container">
            <span>This may take roughly 30 seconds. Thanks for your patience.</span>
          </div> : <div style={{height: 100}}/>
      }
    </div>
  );
}

export default App;

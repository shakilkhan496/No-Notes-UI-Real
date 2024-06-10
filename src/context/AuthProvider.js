import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithRedirect, signOut } from 'firebase/auth';
import { auth, provider } from '../firebase/firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                console.log("User signed in:", user);
            } else {
                setUser(null);
                console.log("User signed out.");
            }
        });

        return () => unsubscribe();
    }, []);

    const signIn = () => signInWithRedirect(auth, provider);

    const signOutUser = () => {
        signOut(auth).then(() => {
            setUser(null);
            console.log("Sign-out successful.");
        }).catch((error) => {
            console.log("Error signing out:", error);
        });
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signOutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

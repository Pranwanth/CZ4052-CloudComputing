// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import app from '/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/firebaseApp.js'; // adjust this import to the location of your Firebase app initialization

export const AuthContext = createContext();

const auth = getAuth(app);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signOut = () => {
    firebaseSignOut(auth).then(() => {
      setUser(null);
    }).catch((error) => {
      console.error("Sign out error:", error);
    });
  };

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

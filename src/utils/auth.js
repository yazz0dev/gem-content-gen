// src/utils/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail, // Alias to avoid naming conflicts
  getAuth
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
const auth = getAuth();

async function signup(email, password) {
  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
          lastGenerationDate: null, // Initialize lastGenerationDate
      });
  } catch (error) {
      // Improve error handling
      if (error.code === 'auth/weak-password') {
          throw new Error('Password should be at least 6 characters.');
      } else if (error.code === 'auth/email-already-in-use') {
          throw new Error('The email address is already in use by another account.');
      } else {
          throw new Error("Signup failed. Please try again.");
      }
  }
}

async function login(email, password) {
  try {
      await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
      // Improve error handling
      if (error.code === 'auth/invalid-credential') {
          throw new Error("Login failed.  Please check your email and password.");
      }
      throw new Error('Login failed. Please try again later.');
  }
}

async function signOutUser() {
  try {
      await signOut(auth);
  } catch (error) {
      throw new Error('Sign out failed. Please try again later.');
  }
}

async function sendPasswordResetEmail(email) {
  try {
      await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    if (error.code === 'auth/user-not-found'){
      throw new Error("User not found, check the email provided")
    }
      throw new Error('Password reset failed. Please try again.');
  }
}

export { signup, login, signOutUser, sendPasswordResetEmail };

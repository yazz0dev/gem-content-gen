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

const handleAuthError = (error) => {
  console.error('Auth error:', error);
  
  // Network connection errors
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please check your network.');
  }
  
  if (error.code === 'auth/network-request-failed') {
    throw new Error('Connection failed. Please try again.');
  }

  // Common auth errors
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
  };

  throw new Error(errorMessages[error.code] || error.message || 'Authentication failed. Please try again.');
};

async function signup(email, password) {
  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
          lastGenerationDate: null, // Initialize lastGenerationDate
          generationCount: 0, // Initialize generation count.  *CRITICAL*
      });
  } catch (error) {
      throw handleAuthError(error);
  }
}

async function login(email, password) {
  try {
      await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
      throw handleAuthError(error);
  }
}

async function signOutUser() {
  try {
      await signOut(auth);
  } catch (error) {
      throw handleAuthError(error);
  }
}

async function sendPasswordResetEmail(email) {
  try {
      await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
     throw handleAuthError(error);
  }
}

// Add connection status monitoring
export const initializeAuthStatusMonitoring = () => {
  window.addEventListener('online', () => {
    console.log('Connection restored');
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost');
  });
};

export { signup, login, signOutUser, sendPasswordResetEmail };
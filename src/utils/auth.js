// src/utils/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  getAuth
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/api/firebase.js';
const auth = getAuth();

const errorMessages = {
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/operation-not-allowed': 'Operation not allowed.',
  'auth/weak-password': 'Password is too weak.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'default': 'An unexpected error occurred. Please try again.'
};

const handleAuthError = (error) => {
  console.error('Auth Error:', error);
  
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network.';
  }

  return errorMessages[error.code] || errorMessages.default;
};

const API_KEY_SESSION_KEY = 'gemini_developer_api_key';

function setDeveloperApiKey(apiKey) {
  try {
    sessionStorage.setItem(API_KEY_SESSION_KEY, apiKey);
  } catch (error) {
    console.error("Error setting API key in session storage:", error);
    throw new Error("Unable to store API key. Please check your browser settings.");
  }
}

function getDeveloperApiKey() {
  return sessionStorage.getItem(API_KEY_SESSION_KEY);
}

function clearDeveloperApiKey() {
  sessionStorage.removeItem(API_KEY_SESSION_KEY);
}

async function signup(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user document in Firestore, initializing with 'user' role.
    await setDoc(doc(db, "users", user.uid), {
      lastGenerationDate: null,
      generationCount: 0,
      role: 'user', // Default role is 'user'
      credits: 0, // Initialize credits to 0
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
    clearDeveloperApiKey();
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

// Get User Role (moved here from firebaseUtils)
async function getUserRole(userId) {
    if (!userId) return 'guest'; // Or some default
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        return userDoc.data().role || 'user'; // Default to 'user' if role is missing
    }
    return 'user'; // Default to user if no document.
}

// Add connection status monitoring
export const initializeAuthStatusMonitoring = () => {
  window.addEventListener('online', () => {
    auth.useEmulator('http://localhost:9099');
  });

  window.addEventListener('offline', () => {
    console.warn('Application is offline');
  });
};

export { signup, login, signOutUser, sendPasswordResetEmail, getUserRole, setDeveloperApiKey, getDeveloperApiKey, clearDeveloperApiKey };
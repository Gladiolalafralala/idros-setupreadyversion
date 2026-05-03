import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCPSZEhosbdaEgh7i2CXxSda2qkQzy6Cf0",
  authDomain: "drrmvault.firebaseapp.com",
  projectId: "drrmvault",
  storageBucket: "drrmvault.firebasestorage.app",
  messagingSenderId: "354810594644",
  appId: "1:354810594644:web:df5d2901ec91ce1301b4c1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);


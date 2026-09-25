import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
export const configured=Boolean(import.meta.env.VITE_FIREBASE_API_KEY&&import.meta.env.VITE_FIREBASE_PROJECT_ID&&import.meta.env.VITE_FIREBASE_APP_ID);
const app=initializeApp({apiKey:import.meta.env.VITE_FIREBASE_API_KEY||'unconfigured',authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN||'unconfigured.invalid',projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID||'unconfigured',appId:import.meta.env.VITE_FIREBASE_APP_ID||'unconfigured',messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID});
export const auth=getAuth(app);
export const provider=new GoogleAuthProvider();
export const db=getFirestore(app);

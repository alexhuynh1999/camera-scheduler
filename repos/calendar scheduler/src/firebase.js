import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {

    apiKey: "AIzaSyB7oHTGIM61ZIuRqi9fWMqzAzNpgZESlQg",

    authDomain: "calendar-scheduler-beae1.firebaseapp.com",

    projectId: "calendar-scheduler-beae1",

    storageBucket: "calendar-scheduler-beae1.firebasestorage.app",

    messagingSenderId: "517635746650",

    appId: "1:517635746650:web:9f6fe403c3b093371f2163"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

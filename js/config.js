// ============================================================
// CONFIGURE YOUR FIREBASE PROJECT HERE
// Replace all placeholder values with your real credentials
// from: Firebase Console → Project Settings → Your apps
// ============================================================
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

firebase.initializeApp(FIREBASE_CONFIG);

const auth = firebase.auth();
const db   = firebase.firestore();

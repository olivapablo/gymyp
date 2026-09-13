window.FITTRACK = window.FITTRACK || {};

const firebaseConfig = {
  apiKey: "AIzaSyAO1wN_7ESR5gmSLi5Aqe81nIvPFJvkZ-s",
  authDomain: "fittrack-55b9b.firebaseapp.com",
  projectId: "fittrack-55b9b",
  storageBucket: "fittrack-55b9b.firebasestorage.app",
  messagingSenderId: "578082351612",
  appId: "1:578082351612:web:1f5adb21f9e9fbcdb4aa79"
};

firebase.initializeApp(firebaseConfig);

window.FITTRACK.auth = firebase.auth();
window.FITTRACK.googleProvider = new firebase.auth.GoogleAuthProvider();
window.FITTRACK.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

window.FITTRACK.db = firebase.firestore();

window.FITTRACK.db.enablePersistence({ synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('[FITTRACK] Firestore persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('[FITTRACK] Firestore persistence: not supported');
    }
  });

window.FITTRACK.FieldValue = firebase.firestore.FieldValue;
window.FITTRACK.Timestamp = firebase.firestore.Timestamp;

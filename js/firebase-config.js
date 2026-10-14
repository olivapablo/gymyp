window.FITTRACK = window.FITTRACK || {};

const firebaseConfig = {
  apiKey: "AIzaSyACaGP2E5W0GQRle4Wf_-WitN6RgsFG278",
  authDomain: "gym-tracker-myp.firebaseapp.com",
  projectId: "gym-tracker-myp",
  storageBucket: "gym-tracker-myp.firebasestorage.app",
  messagingSenderId: "279792758331",
  appId: "1:279792758331:web:89cd63d200f5273098361e"
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

/**
 * Utility to strip undefined values recursively so Firestore add/set/update never throws invalid data error
 */
window.FITTRACK.cleanUndefined = function(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => window.FITTRACK.cleanUndefined(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Date) && typeof obj.toDate !== 'function' && typeof obj.isEqual !== 'function') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = window.FITTRACK.cleanUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};


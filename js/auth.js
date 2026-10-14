window.FITTRACK = window.FITTRACK || {};

window.FITTRACK.signInWithGoogle = async function() {
  try {
    const result = await window.FITTRACK.auth.signInWithPopup(window.FITTRACK.googleProvider);
    return result.user;
  } catch (error) {
    console.error('[Auth] Error signing in:', error);
    throw error;
  }
};

window.FITTRACK.signOut = async function() {
  try {
    await window.FITTRACK.auth.signOut();
  } catch (error) {
    console.error('[Auth] Error signing out:', error);
    throw error;
  }
};

window.FITTRACK.onAuthStateChanged = function(callback) {
  return window.FITTRACK.auth.onAuthStateChanged(callback);
};

window.FITTRACK.getCurrentUser = function() {
  return window.FITTRACK.auth.currentUser;
};

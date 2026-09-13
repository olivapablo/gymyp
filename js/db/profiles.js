window.FITTRACK = window.FITTRACK || {};

window.FITTRACK.getProfile = async function() {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const profileRef = window.FITTRACK.db.collection('users').doc(user.uid).collection('profile').doc('main');
  
  try {
    const doc = await profileRef.get();
    
    if (doc.exists) {
      return doc.data();
    } else {
      const defaultProfile = {
        displayName: user.displayName || 'Atleta',
        email: user.email,
        photoURL: user.photoURL || null,
        customPhotoBase64: null,
        createdAt: window.FITTRACK.FieldValue.serverTimestamp(),
        preferences: {
          theme: 'dark',
          notifications: false
        }
      };
      
      await profileRef.set(defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.error('[DB] Error getting/creating profile:', error);
    throw error;
  }
};

window.FITTRACK.updateProfile = async function(data) {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const profileRef = window.FITTRACK.db.collection('users').doc(user.uid).collection('profile').doc('main');
  
  try {
    await profileRef.set({
      ...data,
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[DB] Error updating profile:', error);
    throw error;
  }
};

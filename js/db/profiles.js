window.FITTRACK = window.FITTRACK || {};

window.FITTRACK.getProfile = async function() {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const cacheKey = `fittrack_profile_${user.uid}`;
  const defaultProfile = {
    displayName: user.displayName || 'Atleta',
    email: user.email,
    photoURL: user.photoURL || null,
    customPhotoBase64: null,
    preferences: {
      theme: localStorage.getItem('fittrack_theme') || 'dark',
      notifications: false
    }
  };

  try {
    const profileRef = window.FITTRACK.db.collection('users').doc(user.uid).collection('profile').doc('main');
    const doc = await profileRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch(_) {}
      return data;
    } else {
      // Also check root users/{uid} doc
      try {
        const rootUserDoc = await window.FITTRACK.db.collection('users').doc(user.uid).get();
        if (rootUserDoc.exists) {
          const rootData = rootUserDoc.data();
          const merged = { ...defaultProfile, ...rootData };
          try { localStorage.setItem(cacheKey, JSON.stringify(merged)); } catch(_) {}
          return merged;
        }
      } catch (_) {}

      const newProfile = {
        ...defaultProfile,
        createdAt: window.FITTRACK.FieldValue.serverTimestamp()
      };
      
      try {
        await profileRef.set(newProfile);
      } catch (writeErr) {
        console.warn('[DB] Could not set default profile on Firestore:', writeErr.message);
      }
      try { localStorage.setItem(cacheKey, JSON.stringify(newProfile)); } catch(_) {}
      return newProfile;
    }
  } catch (error) {
    console.warn('[DB] Error getting profile from Firestore (using fallback):', error.message);
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.permissionError = (error.code === 'permission-denied' || error.message?.includes('permissions'));
        return parsed;
      }
    } catch (_) {}

    return {
      ...defaultProfile,
      permissionError: (error.code === 'permission-denied' || error.message?.includes('permissions'))
    };
  }
};

window.FITTRACK.updateProfile = async function(data) {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const cacheKey = `fittrack_profile_${user.uid}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    const existing = cached ? JSON.parse(cached) : {};
    localStorage.setItem(cacheKey, JSON.stringify({ ...existing, ...data }));
  } catch (_) {}

  try {
    const profileRef = window.FITTRACK.db.collection('users').doc(user.uid).collection('profile').doc('main');
    const rawData = {
      ...data,
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    };
    const cleanedData = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(rawData) : rawData;
    await profileRef.set(cleanedData, { merge: true });
    return true;
  } catch (error) {
    console.warn('[DB] Error updating profile on Firestore (persisted locally):', error.message);
    return true;
  }
};

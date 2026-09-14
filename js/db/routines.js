window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.db = window.FITTRACK.db || {};

// Helpers to get routine collection reference for current user
function getRoutinesRef() {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return window.FITTRACK.db.collection('users').doc(user.uid).collection('routines');
}

/**
 * Get all routines for the current user
 */
/**
 * Get all routines for the current user (own + shared routines sent to user's email)
 */
window.FITTRACK.getRoutines = async function() {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    // 1. Fetch own routines
    const snapshot = await getRoutinesRef().get();
    const ownRoutines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isShared: false }));

    // 2. Fetch shared routines assigned to current user's email
    let sharedRoutines = [];
    if (user.email) {
      try {
        const sharedSnap = await window.FITTRACK.db.collection('shared_routines')
          .where('targetEmail', '==', user.email.toLowerCase().trim())
          .get();
        sharedRoutines = sharedSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isShared: true
        }));
      } catch (err) {
        console.warn('[DB] Shared routines query note:', err.message);
      }
    }

    // Deduplicate by ID
    const seenIds = new Set();
    const allRoutines = [];
    for (const r of [...ownRoutines, ...sharedRoutines]) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        allRoutines.push(r);
      }
    }

    // Helper function to extract Day number or number from title if exists (e.g. "Día 1", "Dia 2", etc.)
    function extractDayNumber(name) {
      if (!name) return null;
      const match = name.match(/d[ií]a\s*(\d+)/i) || name.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }

    allRoutines.sort((a, b) => {
      const dayA = extractDayNumber(a.name);
      const dayB = extractDayNumber(b.name);
      
      // If both have day/numbers in name, sort ascending (Día 1 -> Día 2 -> Día 3...)
      if (dayA !== null && dayB !== null && dayA !== dayB) {
        return dayA - dayB;
      }
      
      // If one has day and the other doesn't
      if (dayA !== null && dayB === null) return -1;
      if (dayA === null && dayB !== null) return 1;

      // Otherwise, sort alphabetically or by creation date ascending
      const nameComp = (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
      if (nameComp !== 0) return nameComp;

      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tA - tB;
    });

    return allRoutines;
  } catch (error) {
    console.error('[DB] Error loading routines:', error);
    throw error;
  }
};

/**
 * Get a single routine by ID (checks own routines or shared_routines)
 */
window.FITTRACK.getRoutine = async function(routineId) {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Check own routines first
    const doc = await getRoutinesRef().doc(routineId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data(), isShared: false };
    }

    // Check shared routines
    const sharedDoc = await window.FITTRACK.db.collection('shared_routines').doc(routineId).get();
    if (sharedDoc.exists) {
      return { id: sharedDoc.id, ...sharedDoc.data(), isShared: true };
    }

    throw new Error('Rutina no encontrada');
  } catch (error) {
    console.error('[DB] Error loading routine:', error);
    throw error;
  }
};

/**
 * Create a new routine (and share if targetEmail provided)
 */
window.FITTRACK.createRoutine = async function(routineData) {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const rawRoutine = {
      ...routineData,
      exercises: routineData.exercises || [],
      createdAt: window.FITTRACK.FieldValue.serverTimestamp(),
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    };
    const newRoutine = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(rawRoutine) : rawRoutine;

    const docRef = await getRoutinesRef().add(newRoutine);
    const created = { id: docRef.id, ...newRoutine };

    // If target email is specified, also share to shared_routines collection
    if (routineData.assignedEmail && routineData.assignedEmail.trim()) {
      await window.FITTRACK.shareRoutine(docRef.id, routineData.assignedEmail.trim());
    }

    return created;
  } catch (error) {
    console.error('[DB] Error creating routine:', error);
    throw error;
  }
};

/**
 * Share a routine by email
 */
window.FITTRACK.shareRoutine = async function(routineIdOrData, targetEmail) {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    let routine = routineIdOrData;
    if (typeof routineIdOrData === 'string') {
      routine = await window.FITTRACK.getRoutine(routineIdOrData);
    }

    const rawSharedData = {
      name: routine.name || 'Rutina compartida',
      description: routine.description || '',
      exercises: routine.exercises || [],
      senderUid: user.uid,
      senderEmail: user.email || 'Alguien',
      senderName: user.displayName || user.email || 'Tu pareja/entrenador',
      targetEmail: targetEmail.toLowerCase().trim(),
      createdAt: window.FITTRACK.FieldValue.serverTimestamp()
    };
    const sharedData = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(rawSharedData) : rawSharedData;

    const docRef = await window.FITTRACK.db.collection('shared_routines').add(sharedData);
    return { id: docRef.id, ...sharedData };
  } catch (error) {
    console.error('[DB] Error sharing routine:', error);
    throw error;
  }
};

/**
 * Import a shared routine into user's own routines
 */
window.FITTRACK.importSharedRoutine = async function(sharedRoutineId) {
  try {
    const sharedDoc = await window.FITTRACK.db.collection('shared_routines').doc(sharedRoutineId).get();
    if (!sharedDoc.exists) throw new Error('Rutina compartida no existe');

    const data = sharedDoc.data();
    const imported = await window.FITTRACK.createRoutine({
      name: `${data.name} (Importada)`,
      description: data.description ? `${data.description} — Enviada por ${data.senderName}` : `Enviada por ${data.senderName}`,
      exercises: data.exercises || []
    });

    // Clean up shared routine record after import to prevent duplicate display
    try {
      await window.FITTRACK.db.collection('shared_routines').doc(sharedRoutineId).delete();
    } catch (e) {
      console.warn('Could not delete shared routine post-import', e);
    }

    return imported;
  } catch (error) {
    console.error('[DB] Error importing shared routine:', error);
    throw error;
  }
};

/**
 * Update an existing routine
 */
window.FITTRACK.updateRoutine = async function(routineId, routineData) {
  try {
    const rawUpdateData = {
      ...routineData,
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    };
    const updateData = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(rawUpdateData) : rawUpdateData;
    await getRoutinesRef().doc(routineId).update(updateData);

    if (routineData.assignedEmail && routineData.assignedEmail.trim()) {
      await window.FITTRACK.shareRoutine(routineId, routineData.assignedEmail.trim());
    }

    return true;
  } catch (error) {
    console.error('[DB] Error updating routine:', error);
    throw error;
  }
};

/**
 * Delete a routine
 */
window.FITTRACK.deleteRoutine = async function(routineId) {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    let deletedAny = false;

    // Try deleting from own routines
    try {
      await getRoutinesRef().doc(routineId).delete();
      deletedAny = true;
    } catch(e) {
      console.warn('Own routine delete:', e);
    }

    // Try deleting from shared_routines
    try {
      await window.FITTRACK.db.collection('shared_routines').doc(routineId).delete();
      deletedAny = true;
    } catch(e) {
      console.warn('Shared routine delete:', e);
    }

    return deletedAny;
  } catch (error) {
    console.error('[DB] Error deleting routine:', error);
    throw error;
  }
};

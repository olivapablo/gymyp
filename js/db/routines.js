window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.db = window.FITTRACK.db || {};

// Helper — user routines sub-collection (for newly created user routines)
function getUserRoutinesRef() {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return window.FITTRACK.db.collection('users').doc(user.uid).collection('routines');
}

/**
 * Get all routines for the current user.
 * Implements the 10 official routines defined in rutinas_gym_implementacion.md:
 * 5 for Pablo ("Mi rutina" - #2563EB) and 5 for his partner ("Rutina de mi pareja" - #DB2777).
 * Preserves past logged exercise weights, sets, and workout history.
 */
window.FITTRACK.getRoutines = async function() {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Load official specification from window.FITTRACK.OFFICIAL_ROUTINES_DATA
    const spec = window.FITTRACK.OFFICIAL_ROUTINES_DATA || { routines: [] };

    // Fetch existing exercise logs and historical weights in parallel for preservation
    let previousLogs = {};
    if (window.FITTRACK.getLastExerciseLogs) {
      try {
        previousLogs = await window.FITTRACK.getLastExerciseLogs();
      } catch (err) {
        console.warn('[DB] Could not load exercise logs for weight linking:', err.message);
      }
    }

    // Build the 10 official routines
    const officialRoutines = spec.routines.map(r => {
      const isPartner = (r.owner_id === 'partner');
      const routineColor = r.color || (isPartner ? '#DB2777' : '#2563EB');
      const ownerLabel = r.owner_label || (isPartner ? 'Rutina de mi pareja' : 'Mi rutina');

      const mappedExercises = r.exercises.map((ex, idx) => {
        const exKey = (ex.name || '').trim().toLowerCase();
        const prevData = previousLogs[exKey] || [];
        const lastLog = prevData.length > 0 ? prevData[0] : null;
        const preservedWeight = (lastLog && lastLog.kg) ? String(lastLog.kg) : '';

        return {
          id: ex.id || `ex_${r.id}_${idx + 1}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest_seconds,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes || '',
          weight: preservedWeight,
          type: 'fuerza',
          order: idx
        };
      });

      return {
        id: r.id,
        name: r.name,
        fullName: `${ownerLabel}: ${r.name}`,
        owner_id: r.owner_id,
        owner_label: ownerLabel,
        color: routineColor,
        day_order: r.day_order,
        description: `Sesión de ${r.name} — ${ownerLabel}`,
        exercises: mappedExercises,
        isShared: isPartner,
        owner: isPartner ? 'partner' : 'me',
        senderName: isPartner ? 'Mar' : '',
        senderEmail: isPartner ? 'mar.armando1997@gmail.com' : ''
      };
    });

    // Also fetch any custom user-created routines from Firestore to ensure zero data loss
    try {
      const customSnap = await getUserRoutinesRef().get().catch(() => ({ docs: [] }));
      if (customSnap.docs && customSnap.docs.length > 0) {
        customSnap.docs.forEach(doc => {
          const d = doc.data();
          // Avoid duplicate IDs
          if (!officialRoutines.some(o => o.id === doc.id)) {
            officialRoutines.push({
              id: doc.id,
              ...d,
              color: d.isShared ? '#DB2777' : '#2563EB',
              isShared: !!d.isShared
            });
          }
        });
      }
    } catch (_) {}

    // Sort: 5 for "Mi rutina" (1 to 5), then 5 for "Rutina de mi pareja" (1 to 5)
    officialRoutines.sort((a, b) => {
      const orderA = a.owner_id === 'partner' ? 1 : 0;
      const orderB = b.owner_id === 'partner' ? 1 : 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.day_order || 0) - (b.day_order || 0);
    });

    // Cache locally
    try {
      localStorage.setItem(`fittrack_routines_${user.uid}`, JSON.stringify(officialRoutines));
    } catch (_) {}

    return officialRoutines;
  } catch (error) {
    console.warn('[DB] Error loading routines (using local cache):', error.message);
    try {
      const user = window.FITTRACK.getCurrentUser();
      if (user) {
        const cached = localStorage.getItem(`fittrack_routines_${user.uid}`);
        if (cached) return JSON.parse(cached);
      }
    } catch (_) {}
    return [];
  }
};

/**
 * Get a single routine by ID (supports the 10 official routines and custom ones)
 */
window.FITTRACK.getRoutine = async function(routineId) {
  try {
    const all = await window.FITTRACK.getRoutines();
    const found = all.find(r => r.id === routineId);
    if (found) return found;

    // Fallback: check Firestore directly
    const userDoc = await getUserRoutinesRef().doc(routineId).get().catch(() => ({ exists: false }));
    if (userDoc.exists) return { id: userDoc.id, ...userDoc.data() };

    throw new Error('Rutina no encontrada');
  } catch (error) {
    console.error('[DB] Error loading routine:', error);
    throw error;
  }
};

/**
 * Create a new routine
 */
window.FITTRACK.createRoutine = async function(routineData) {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const rawRoutine = {
      ...routineData,
      userId: user.uid,
      userEmail: user.email || '',
      exercises: routineData.exercises || [],
      createdAt: window.FITTRACK.FieldValue.serverTimestamp(),
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    };
    const newRoutine = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(rawRoutine) : rawRoutine;

    const docRef = await getUserRoutinesRef().add(newRoutine);
    return { id: docRef.id, ...newRoutine };
  } catch (error) {
    console.error('[DB] Error creating routine:', error);
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

    await getUserRoutinesRef().doc(routineId).set(updateData, { merge: true });
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
    await getUserRoutinesRef().doc(routineId).delete().catch(() => {});
    return true;
  } catch (error) {
    console.error('[DB] Error deleting routine:', error);
    throw error;
  }
};

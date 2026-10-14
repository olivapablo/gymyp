window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.db = window.FITTRACK.db || {};

// Helper — user routines sub-collection (for newly created routines)
function getUserRoutinesRef() {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return window.FITTRACK.db.collection('users').doc(user.uid).collection('routines');
}

/**
 * Get all routines for the current user.
 * Reads from THREE places in PARALLEL for speed:
 *   1. Root collection /routines  (where gym-tracker-myp stores all data)
 *   2. users/{uid}/routines       (where the app writes new routines)
 *   3. shared_routines            (routines shared to user's email)
 * Then fetches /routineExercises IN BULK (single query) and attaches them.
 */
window.FITTRACK.getRoutines = async function() {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const currentEmail = (user.email || '').toLowerCase().trim();

    // ── Fire all three collection queries + routineExercises in PARALLEL ──
    const [rootSnap, userSnap, sharedSnap, allExercisesSnap] = await Promise.all([
      window.FITTRACK.db.collection('routines').get().catch(() => ({ docs: [], empty: true })),
      getUserRoutinesRef().get().catch(() => ({ docs: [], empty: true })),
      currentEmail
        ? window.FITTRACK.db.collection('shared_routines')
            .where('targetEmail', '==', currentEmail)
            .get().catch(() => ({ docs: [], empty: true }))
        : Promise.resolve({ docs: [], empty: true }),
      window.FITTRACK.db.collection('routineExercises').get().catch(() => ({ docs: [], empty: true }))
    ]);

    // ── Build routineExercises lookup map: routineId → [exercises] ──
    const exercisesByRoutine = {};
    if (allExercisesSnap.docs) {
      allExercisesSnap.docs.forEach(eDoc => {
        const ed = eDoc.data();
        const rId = ed.routineId || ed.routine_id || ed.routineID || '';
        if (!rId) return;
        if (!exercisesByRoutine[rId]) exercisesByRoutine[rId] = [];
        exercisesByRoutine[rId].push({
          id: eDoc.id,
          name: ed.name || ed.exerciseName || ed.title || ed.nombre || 'Ejercicio',
          muscle: ed.muscle || ed.muscleGroup || ed.grupoMuscular || '',
          sets: ed.sets || ed.targetSets || ed.series || '3',
          reps: ed.reps || ed.targetReps || ed.repeticiones || '10',
          weight: ed.weight !== undefined ? ed.weight : (ed.targetWeight !== undefined ? ed.targetWeight : (ed.peso !== undefined ? String(ed.peso) : '')),
          rir: ed.rir !== undefined ? String(ed.rir) : (ed.targetRir !== undefined ? String(ed.targetRir) : ''),
          rest: ed.rest || ed.restSeconds || ed.descanso || '90',
          notes: ed.notes || ed.instrucciones || ed.notas || '',
          type: ed.type || 'fuerza',
          modality: ed.modality || '',
          order: ed.order !== undefined ? ed.order : (ed.orderIndex !== undefined ? ed.orderIndex : (ed.index !== undefined ? ed.index : 999)),
        });
      });
    }
    // Sort each exercise array by order
    Object.values(exercisesByRoutine).forEach(arr => arr.sort((a, b) => (a.order || 0) - (b.order || 0)));

    // ── Merge all routine docs, deduplicating by ID ──
    const seenIds = new Set();
    const allRoutines = [];

    function addRoutine(doc, source) {
      if (seenIds.has(doc.id)) return;
      seenIds.add(doc.id);
      const data = doc.data();

      // Determine exercises: embedded array or separate routineExercises collection
      let exercises = [];
      if (Array.isArray(data.exercises) && data.exercises.length > 0) {
        exercises = data.exercises;
      } else if (exercisesByRoutine[doc.id]) {
        exercises = exercisesByRoutine[doc.id];
      }

      // Determine ownership
      const routineUserId = data.userId || data.user_id || data.uid || data.ownerId || data.creatorId || '';
      const routineEmail = (data.userEmail || data.email || '').toLowerCase().trim();

      let isShared = false;
      if (source === 'shared') {
        isShared = true;
      } else if (source === 'root' && routineUserId && routineUserId !== user.uid && routineEmail && routineEmail !== currentEmail) {
        isShared = true;
      }

      allRoutines.push({
        id: doc.id,
        ...data,
        exercises,
        isShared,
      });
    }

    // 1. Root routines (primary source for gym-tracker-myp)
    if (rootSnap.docs) rootSnap.docs.forEach(d => addRoutine(d, 'root'));

    // 2. User sub-collection routines
    if (userSnap.docs) userSnap.docs.forEach(d => addRoutine(d, 'user'));

    // 3. Shared routines
    if (sharedSnap.docs) sharedSnap.docs.forEach(d => addRoutine(d, 'shared'));

    // ── Sort: Día 1, Día 2, etc. then alphabetical ──
    function extractDayNumber(name) {
      if (!name) return null;
      const match = name.match(/d[ií]a\s*(\d+)/i) || name.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }

    allRoutines.sort((a, b) => {
      const dayA = extractDayNumber(a.name);
      const dayB = extractDayNumber(b.name);
      if (dayA !== null && dayB !== null && dayA !== dayB) return dayA - dayB;
      if (dayA !== null && dayB === null) return -1;
      if (dayA === null && dayB !== null) return 1;
      const nameComp = (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
      if (nameComp !== 0) return nameComp;
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tA - tB;
    });

    // Cache locally
    try {
      localStorage.setItem(`fittrack_routines_${user.uid}`, JSON.stringify(allRoutines));
    } catch (_) {}

    return allRoutines;
  } catch (error) {
    console.warn('[DB] Error loading routines from Firestore (using local cache):', error.message);
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
 * Get a single routine by ID.
 * Checks root /routines, users/{uid}/routines, and shared_routines.
 * Attaches exercises from /routineExercises if the document doesn't have them embedded.
 */
window.FITTRACK.getRoutine = async function(routineId) {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Try all three locations in parallel
    const [rootDoc, userDoc, sharedDoc] = await Promise.all([
      window.FITTRACK.db.collection('routines').doc(routineId).get().catch(() => ({ exists: false })),
      getUserRoutinesRef().doc(routineId).get().catch(() => ({ exists: false })),
      window.FITTRACK.db.collection('shared_routines').doc(routineId).get().catch(() => ({ exists: false })),
    ]);

    let doc = null;
    let isShared = false;

    if (rootDoc.exists) {
      doc = rootDoc;
    } else if (userDoc.exists) {
      doc = userDoc;
    } else if (sharedDoc.exists) {
      doc = sharedDoc;
      isShared = true;
    }

    if (!doc) throw new Error('Rutina no encontrada');

    const data = doc.data();
    let exercises = [];

    if (Array.isArray(data.exercises) && data.exercises.length > 0) {
      exercises = data.exercises;
    } else {
      // Fetch from routineExercises collection
      try {
        let exSnap = await window.FITTRACK.db.collection('routineExercises')
          .where('routineId', '==', routineId)
          .get();

        if (exSnap.empty) {
          exSnap = await window.FITTRACK.db.collection('routineExercises')
            .where('routine_id', '==', routineId)
            .get();
        }

        if (!exSnap.empty) {
          exercises = exSnap.docs.map(eDoc => {
            const ed = eDoc.data();
            return {
              id: eDoc.id,
              name: ed.name || ed.exerciseName || ed.title || ed.nombre || 'Ejercicio',
              muscle: ed.muscle || ed.muscleGroup || ed.grupoMuscular || '',
              sets: ed.sets || ed.targetSets || ed.series || '3',
              reps: ed.reps || ed.targetReps || ed.repeticiones || '10',
              weight: ed.weight !== undefined ? ed.weight : (ed.targetWeight !== undefined ? ed.targetWeight : (ed.peso !== undefined ? String(ed.peso) : '')),
              rir: ed.rir !== undefined ? String(ed.rir) : (ed.targetRir !== undefined ? String(ed.targetRir) : ''),
              rest: ed.rest || ed.restSeconds || ed.descanso || '90',
              notes: ed.notes || ed.instrucciones || ed.notas || '',
              type: ed.type || 'fuerza',
              modality: ed.modality || '',
              order: ed.order !== undefined ? ed.order : (ed.orderIndex !== undefined ? ed.orderIndex : 999),
            };
          }).sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      } catch (err) {
        console.warn('[DB] Could not fetch routineExercises for', routineId, err.message);
      }
    }

    return { id: doc.id, ...data, exercises, isShared };
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

    // Write to both user sub-collection AND root collection for compatibility
    const docRef = await getUserRoutinesRef().add(newRoutine);

    try {
      await window.FITTRACK.db.collection('routines').doc(docRef.id).set(newRoutine);
    } catch (_) {}

    const created = { id: docRef.id, ...newRoutine };

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

    // Update in both locations
    const results = await Promise.allSettled([
      getUserRoutinesRef().doc(routineId).set(updateData, { merge: true }),
      window.FITTRACK.db.collection('routines').doc(routineId).set(updateData, { merge: true }),
    ]);

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

    // Delete from all three locations in parallel
    const results = await Promise.allSettled([
      getUserRoutinesRef().doc(routineId).delete(),
      window.FITTRACK.db.collection('routines').doc(routineId).delete(),
      window.FITTRACK.db.collection('shared_routines').doc(routineId).delete(),
    ]);

    return true;
  } catch (error) {
    console.error('[DB] Error deleting routine:', error);
    throw error;
  }
};

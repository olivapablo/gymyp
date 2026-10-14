window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.db = window.FITTRACK.db || {};

function getHistoryRef() {
  const user = window.FITTRACK.getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return window.FITTRACK.db.collection('users').doc(user.uid).collection('history');
}

/**
 * Start a new workout from a routine
 */
window.FITTRACK.startWorkout = async function(routineData) {
  try {
    const rawExercises = routineData && Array.isArray(routineData.exercises) ? routineData.exercises : [];
    
    const exercises = rawExercises.map((ex, idx) => {
      const exercise = {
        id: ex.id || `ex_${idx}_${Date.now()}`,
        type: ex.type || 'fuerza',
        name: ex.name || 'Ejercicio',
        targetSets: ex.sets || ex.targetSets || '3',
        targetReps: ex.reps || ex.targetReps || '8-12',
        targetRir: ex.rir !== undefined && ex.rir !== null ? String(ex.rir) : (ex.targetRir !== undefined && ex.targetRir !== null ? String(ex.targetRir) : ''),
        notes: ex.notes || '',
        sets: [] // We will populate this as the user completes sets
      };

      if (ex.muscle !== undefined) exercise.muscle = ex.muscle;
      if (ex.weight !== undefined) exercise.weight = ex.weight;
      if (ex.rest !== undefined) exercise.rest = ex.rest;
      if (ex.time !== undefined) exercise.time = ex.time;
      if (ex.distance !== undefined) exercise.distance = ex.distance;
      if (ex.speed !== undefined) exercise.speed = ex.speed;
      if (ex.incline !== undefined) exercise.incline = ex.incline;
      if (ex.modality !== undefined) exercise.modality = ex.modality;

      return window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(exercise) : exercise;
    });

    const rawWorkout = {
      routineId: (routineData && routineData.id) ? routineData.id : null,
      name: (routineData && routineData.name) ? routineData.name : 'Entrenamiento Libre',
      startTime: window.FITTRACK.FieldValue.serverTimestamp(),
      endTime: null,
      status: 'in_progress',
      exercises: exercises
    };

    const workout = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(rawWorkout) : rawWorkout;
    
    const docRef = await getHistoryRef().add(workout);
    return docRef.id;
  } catch (error) {
    console.error('[DB] Error starting workout:', error);
    throw error;
  }
};

/**
 * Get the currently active workout
 */
window.FITTRACK.getActiveWorkout = async function() {
  try {
    const snapshot = await getHistoryRef()
      .where('status', '==', 'in_progress')
      .limit(1)
      .get();
      
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('[DB] Error getting active workout:', error);
    throw error;
  }
};

/**
 * Update an active workout (e.g., logging a set)
 */
window.FITTRACK.updateWorkout = async function(workoutId, workoutData) {
  try {
    const payload = {
      ...workoutData,
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    };
    const cleanedPayload = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(payload) : payload;
    await getHistoryRef().doc(workoutId).update(cleanedPayload);
    return true;
  } catch (error) {
    console.error('[DB] Error updating workout:', error);
    throw error;
  }
};

/**
 * Finish a workout
 */
window.FITTRACK.finishWorkout = async function(workoutId, workoutData) {
  try {
    const payload = {
      exercises: workoutData.exercises || [],
      status: 'completed',
      endTime: window.FITTRACK.FieldValue.serverTimestamp(),
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    };
    const cleanedPayload = window.FITTRACK.cleanUndefined ? window.FITTRACK.cleanUndefined(payload) : payload;
    await getHistoryRef().doc(workoutId).update(cleanedPayload);
    return true;
  } catch (error) {
    console.error('[DB] Error finishing workout:', error);
    // If offline or network error, save to local queue
    if (!navigator.onLine || error.code === 'unavailable' || error.message?.includes('network')) {
      if (window.FITTRACK.offlineQueue) {
        window.FITTRACK.offlineQueue.enqueueWrite('finishWorkout', { workoutId, workoutData });
        if (window.FITTRACK.toast) {
          window.FITTRACK.toast('📦 Guardado localmente (sin conexión). Se sincronizará al volver online.');
        }
        return true;
      }
    }
    throw error;
  }
};

/**
 * Get workout history — checks user subcollection AND root workouts/history collections in PARALLEL
 */
window.FITTRACK.getWorkoutHistory = async function(limit = 20) {
  try {
    const user = window.FITTRACK.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Fire all queries in parallel for speed
    const [userSnap, rootWorkoutsSnap, rootHistorySnap] = await Promise.all([
      getHistoryRef().where('status', '==', 'completed').get().catch(() => ({ docs: [] })),
      window.FITTRACK.db.collection('workouts').get().catch(() => ({ docs: [] })),
      window.FITTRACK.db.collection('history').get().catch(() => ({ docs: [] })),
    ]);

    const seenIds = new Set();
    const items = [];

    // 1. User sub-collection history
    if (userSnap.docs) {
      userSnap.docs.forEach(doc => {
        seenIds.add(doc.id);
        items.push({ id: doc.id, ...doc.data() });
      });
    }

    // 2. Root 'workouts' collection
    if (rootWorkoutsSnap.docs) {
      rootWorkoutsSnap.docs.forEach(doc => {
        if (seenIds.has(doc.id)) return;
        const data = doc.data();
        const wUid = data.userId || data.user_id || data.uid;
        if (!wUid || wUid === user.uid) {
          seenIds.add(doc.id);
          items.push({ id: doc.id, ...data });
        }
      });
    }

    // 3. Root 'history' collection
    if (rootHistorySnap.docs) {
      rootHistorySnap.docs.forEach(doc => {
        if (seenIds.has(doc.id)) return;
        const data = doc.data();
        const wUid = data.userId || data.user_id || data.uid;
        if (!wUid || wUid === user.uid) {
          seenIds.add(doc.id);
          items.push({ id: doc.id, ...data });
        }
      });
    }

    // Sort descending by best available timestamp
    items.sort((a, b) => {
      const parseTime = (item) => {
        if (item.endTime?.toDate) return item.endTime.toDate().getTime();
        if (item.endTime) return new Date(item.endTime).getTime();
        if (item.startTime?.toDate) return item.startTime.toDate().getTime();
        if (item.date?.toDate) return item.date.toDate().getTime();
        if (item.createdAt?.toDate) return item.createdAt.toDate().getTime();
        return 0;
      };
      return parseTime(b) - parseTime(a);
    });

    // Cache
    try {
      localStorage.setItem(`fittrack_history_${user.uid}`, JSON.stringify(items.slice(0, limit)));
    } catch (_) {}

    return items.slice(0, limit);
  } catch (error) {
    console.warn('[DB] Error loading history from Firestore (using local cache):', error.message);
    try {
      const user = window.FITTRACK.getCurrentUser();
      if (user) {
        const cached = localStorage.getItem(`fittrack_history_${user.uid}`);
        if (cached) return JSON.parse(cached);
      }
    } catch (_) {}
    return [];
  }
};

/**
 * Clear all workout history
 */
window.FITTRACK.clearWorkoutHistory = async function() {
  try {
    const historyRef = getHistoryRef();
    const snapshot = await historyRef.get();
    const batch = window.FITTRACK.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('[DB] Error clearing history:', error);
    throw error;
  }
};

/**
 * Delete an individual workout from history
 */
window.FITTRACK.deleteWorkout = async function(workoutId) {
  try {
    await getHistoryRef().doc(workoutId).delete();
    return true;
  } catch (error) {
    console.error('[DB] Error deleting workout:', error);
    throw error;
  }
};

/**
 * Get the latest logged weights and reps per exercise from completed history
 */
window.FITTRACK.getLastExerciseLogs = async function() {
  try {
    const history = await window.FITTRACK.getWorkoutHistory(30);
    const exerciseMap = {};

    history.forEach(workout => {
      const exercises = workout.exercises || [];
      exercises.forEach(ex => {
        if (!ex || !ex.name) return;
        const key = ex.name.trim().toLowerCase();
        
        // If not already recorded, capture from the most recent completed workout that has logs
        if (!exerciseMap[key]) {
          const completedSets = (ex.sets || []).filter(s => s && s.completed && (s.kg || s.reps));
          if (completedSets.length > 0) {
            exerciseMap[key] = completedSets.map(s => ({
              kg: s.kg ? String(s.kg) : '',
              reps: s.reps ? String(s.reps) : ''
            }));
          }
        }
      });
    });

    return exerciseMap;
  } catch (error) {
    console.error('[DB] Error getting last exercise logs:', error);
    return {};
  }
};

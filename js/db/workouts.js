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
 * Get workout history
 */
window.FITTRACK.getWorkoutHistory = async function(limit = 20) {
  try {
    const snapshot = await getHistoryRef()
      .where('status', '==', 'completed')
      .get();
      
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort descending by endTime
    items.sort((a, b) => {
      const timeA = a.endTime?.toDate ? a.endTime.toDate().getTime() : (a.endTime ? new Date(a.endTime).getTime() : 0);
      const timeB = b.endTime?.toDate ? b.endTime.toDate().getTime() : (b.endTime ? new Date(b.endTime).getTime() : 0);
      return timeB - timeA;
    });

    return items.slice(0, limit);
  } catch (error) {
    console.error('[DB] Error loading history:', error);
    throw error;
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




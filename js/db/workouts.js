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
    const workout = {
      routineId: routineData.id || null,
      name: routineData.name || 'Entrenamiento Libre',
      startTime: window.FITTRACK.FieldValue.serverTimestamp(),
      endTime: null,
      status: 'in_progress',
      exercises: routineData.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        targetRir: ex.rir || '',
        sets: [] // We will populate this as the user completes sets
      }))
    };
    
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
    await getHistoryRef().doc(workoutId).update({
      ...workoutData,
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    });
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
    await getHistoryRef().doc(workoutId).update({
      ...workoutData,
      status: 'completed',
      endTime: window.FITTRACK.FieldValue.serverTimestamp(),
      updatedAt: window.FITTRACK.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('[DB] Error finishing workout:', error);
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


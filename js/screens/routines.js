window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.screens = window.FITTRACK.screens || {};

// ==========================================
// EXERCISE MODAL (Premium — matches reference images)
// ==========================================

const WORK_MODALITIES = [
  'Por Repeticiones (ej: 30 Jumping jacks)',
  'Por Tiempo (ej: 60s Plancha)',
  'Por Distancia (ej: 50m Sprint)',
  'Series + Repeticiones (ej: 3x10 Burpees)',
  'Serie + Tiempo (ej: 4x30s Batalla cuerda)',
  'Serie + Distancia (ej: 4x20m Empuje de trineo)',
  'Series + Reps + Carga (ej: 4x15 Swing 16kg)',
];

function openExerciseModal(existingExercise, onSave, onCancel) {
  let currentType = existingExercise?.type || 'fuerza';
  let currentModality = existingExercise?.modality || WORK_MODALITIES[3];

  const overlay = document.createElement('div');
  overlay.className = 'exercise-modal-overlay';

  function getTypeFields(type) {
    if (type === 'fuerza') {
      return `
        <div class="ex-form-group">
          <label class="ex-field-label">Nombre del Ejercicio</label>
          <input type="text" class="ex-input" id="ex-name" placeholder="Ej: Press Banca" value="${existingExercise?.name || ''}">
        </div>
        <div class="ex-fields-grid-2">
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Grupo Muscular</label>
            <input type="text" class="ex-input" id="ex-muscle" placeholder="Pecho" value="${existingExercise?.muscle || ''}">
          </div>
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Series Objetivo</label>
            <input type="number" class="ex-input" id="ex-sets" placeholder="3" value="${existingExercise?.sets || ''}">
          </div>
        </div>
        <div style="margin-bottom:1rem"></div>
        <div class="ex-fields-grid-3">
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Reps Objetivo</label>
            <input type="text" class="ex-input" id="ex-reps" placeholder="8-10" value="${existingExercise?.reps || ''}">
          </div>
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Carga (KG)</label>
            <input type="number" class="ex-input" id="ex-weight" placeholder="Opcional" value="${existingExercise?.weight || ''}">
          </div>
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">RIR Objetivo</label>
            <input type="number" class="ex-input" id="ex-rir" placeholder="2" value="${existingExercise?.rir || ''}">
          </div>
        </div>
        <div style="margin-bottom:1rem"></div>
        <div class="ex-form-group">
          <label class="ex-field-label">Descanso Objetivo (Segundos)</label>
          <input type="number" class="ex-input" id="ex-rest" placeholder="90" value="${existingExercise?.rest || ''}">
        </div>
        <div class="ex-form-group">
          <label class="ex-field-label">Notas o Instrucciones</label>
          <input type="text" class="ex-input" id="ex-notes" placeholder="Ej: Pausa 1 seg abajo, agarre prono" value="${existingExercise?.notes || ''}">
        </div>
      `;
    }

    if (type === 'cinta') {
      return `
        <div class="ex-form-group">
          <label class="ex-field-label">Nombre del Ejercicio</label>
          <input type="text" class="ex-input" id="ex-name" placeholder="Ej: Caminata inclinada" value="${existingExercise?.name || ''}">
        </div>
        <div class="ex-fields-grid-2">
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Tiempo (Min)</label>
            <input type="number" class="ex-input" id="ex-time" placeholder="20" value="${existingExercise?.time || ''}">
          </div>
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Distancia (KM)</label>
            <input type="number" step="0.1" class="ex-input" id="ex-distance" placeholder="3.0" value="${existingExercise?.distance || ''}">
          </div>
        </div>
        <div style="margin-bottom:1rem"></div>
        <div class="ex-fields-grid-2">
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Velocidad (KM/H)</label>
            <input type="number" step="0.1" class="ex-input" id="ex-speed" placeholder="9.0" value="${existingExercise?.speed || ''}">
          </div>
          <div class="ex-form-group" style="margin-bottom:0">
            <label class="ex-field-label">Inclinación (%)</label>
            <input type="number" class="ex-input" id="ex-incline" placeholder="1" value="${existingExercise?.incline || ''}">
          </div>
        </div>
        <div style="margin-bottom:1rem"></div>
        <div class="ex-form-group">
          <label class="ex-field-label">Notas o Instrucciones</label>
          <input type="text" class="ex-input" id="ex-notes" placeholder="Ej: Pausa 1 seg abajo, agarre prono" value="${existingExercise?.notes || ''}">
        </div>
      `;
    }

    // aerobico
    return `
      <div class="ex-form-group">
        <label class="ex-field-label">Nombre del Ejercicio</label>
        <input type="text" class="ex-input" id="ex-name" placeholder="Ej: Burpees" value="${existingExercise?.name || ''}">
      </div>
      <div class="ex-form-group">
        <label class="ex-field-label">Modalidad de Trabajo</label>
        <button type="button" class="ex-select-trigger" id="ex-modality-trigger">
          <span id="ex-modality-label">${currentModality}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>
      <div class="ex-fields-grid-2">
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">Series</label>
          <input type="number" class="ex-input" id="ex-sets" placeholder="3" value="${existingExercise?.sets || ''}">
        </div>
        <div class="ex-form-group" style="margin-bottom:0">
          <label class="ex-field-label">Reps</label>
          <input type="text" class="ex-input" id="ex-reps" placeholder="15" value="${existingExercise?.reps || ''}">
        </div>
      </div>
      <div style="margin-bottom:1rem"></div>
      <div class="ex-form-group">
        <label class="ex-field-label">Notas o Instrucciones</label>
        <input type="text" class="ex-input" id="ex-notes" placeholder="Ej: Pausa 1 seg abajo, agarre prono" value="${existingExercise?.notes || ''}">
      </div>
    `;
  }

  function renderModal() {
    overlay.innerHTML = `
      <div class="exercise-modal" id="exercise-modal-content">
        <h2 class="exercise-modal-title">${existingExercise ? 'Editar Ejercicio' : 'Agregar Ejercicio'}</h2>

        <!-- Type tabs -->
        <div class="ex-type-tabs">
          <button class="ex-type-tab ${currentType === 'fuerza' ? 'active' : ''}" data-type="fuerza" id="tab-fuerza">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5v5"/><path d="M21 9.5v5"/><path d="M3 9.5a2 2 0 0 1 2-2h1.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/><path d="M15.5 9.5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1.5a2 2 0 0 1-2-2v-5z"/></svg>
            Fuerza
          </button>
          <button class="ex-type-tab ${currentType === 'cinta' ? 'active' : ''}" data-type="cinta" id="tab-cinta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="14" width="20" height="6" rx="2"/><path d="M6 14V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/><path d="M10 14V9"/><path d="M14 14V9"/></svg>
            Cinta
          </button>
          <button class="ex-type-tab ${currentType === 'aerobico' ? 'active' : ''}" data-type="aerobico" id="tab-aerobico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Aeróbico
          </button>
        </div>

        <!-- Dynamic fields based on type -->
        <div id="ex-type-fields">
          ${getTypeFields(currentType)}
        </div>

        <!-- Actions -->
        <div class="ex-modal-actions">
          <button class="ex-btn-cancel" id="ex-btn-cancel">Cancelar</button>
          <button class="ex-btn-save" id="ex-btn-save">Guardar Ejercicio</button>
        </div>
      </div>
    `;

    // Tab switching
    overlay.querySelectorAll('.ex-type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentType = tab.getAttribute('data-type');
        renderModal();
      });
    });

    // Modality bottom sheet
    const modalityTrigger = overlay.querySelector('#ex-modality-trigger');
    if (modalityTrigger) {
      modalityTrigger.addEventListener('click', () => openModalitySheet());
    }

    // Cancel
    overlay.querySelector('#ex-btn-cancel').addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });

    // Save
    overlay.querySelector('#ex-btn-save').addEventListener('click', () => {
      const nameEl = overlay.querySelector('#ex-name');
      if (!nameEl || !nameEl.value.trim()) {
        nameEl && nameEl.focus();
        return;
      }

      const data = {
        id: existingExercise?.id || Date.now().toString(),
        type: currentType,
        name: nameEl.value.trim(),
        notes: overlay.querySelector('#ex-notes')?.value.trim() || '',
      };

      if (currentType === 'fuerza') {
        data.muscle = overlay.querySelector('#ex-muscle')?.value.trim() || '';
        data.sets = overlay.querySelector('#ex-sets')?.value || '3';
        data.reps = overlay.querySelector('#ex-reps')?.value || '8-12';
        data.weight = overlay.querySelector('#ex-weight')?.value || '';
        data.rir = overlay.querySelector('#ex-rir')?.value || '';
        data.rest = overlay.querySelector('#ex-rest')?.value || '90';
      } else if (currentType === 'cinta') {
        data.time = overlay.querySelector('#ex-time')?.value || '';
        data.distance = overlay.querySelector('#ex-distance')?.value || '';
        data.speed = overlay.querySelector('#ex-speed')?.value || '';
        data.incline = overlay.querySelector('#ex-incline')?.value || '';
      } else {
        data.modality = currentModality;
        data.sets = overlay.querySelector('#ex-sets')?.value || '3';
        data.reps = overlay.querySelector('#ex-reps')?.value || '15';
      }

      closeModal();
      if (onSave) onSave(data);
    });
  }

  function openModalitySheet() {
    const sheetOverlay = document.createElement('div');
    sheetOverlay.className = 'bottom-sheet-overlay';
    sheetOverlay.innerHTML = `
      <div class="bottom-sheet">
        ${WORK_MODALITIES.map(m => `
          <div class="bottom-sheet-item" data-modality="${m}">
            <span>${m}</span>
            <div class="bottom-sheet-radio ${m === currentModality ? 'selected' : ''}"></div>
          </div>
        `).join('')}
      </div>
    `;

    sheetOverlay.querySelectorAll('.bottom-sheet-item').forEach(item => {
      item.addEventListener('click', () => {
        currentModality = item.getAttribute('data-modality');
        document.body.removeChild(sheetOverlay);
        const label = overlay.querySelector('#ex-modality-label');
        if (label) label.textContent = currentModality;
        // update radio visuals
        overlay.querySelectorAll('.bottom-sheet-radio').forEach(r => r.classList.remove('selected'));
      });
    });

    sheetOverlay.addEventListener('click', (e) => {
      if (e.target === sheetOverlay) document.body.removeChild(sheetOverlay);
    });

    document.body.appendChild(sheetOverlay);
  }

  function closeModal() {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (overlay.parentNode) document.body.removeChild(overlay);
    }, 200);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
      if (onCancel) onCancel();
    }
  });

  renderModal();
  document.body.appendChild(overlay);
}

// Expose globally
window.FITTRACK.openExerciseModal = openExerciseModal;


// ==========================================
// RENDERING ROUTINES LIST
// ==========================================
window.FITTRACK.screens.renderRoutines = async function(container) {
  container.innerHTML = `
    <div class="flex-row justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Mis Rutinas</h1>
      <button id="btn-new-routine" class="btn btn-primary btn-icon" aria-label="Nueva Rutina">
        <i data-lucide="plus"></i>
      </button>
    </div>
    <div id="routines-list" class="flex-col gap-4">
      <div class="flex-col items-center justify-center py-8">
        <div class="spinner"></div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  const routinesListEl = document.getElementById('routines-list');
  const btnNewRoutine = document.getElementById('btn-new-routine');

  btnNewRoutine.addEventListener('click', () => {
    window.location.hash = '#/routine/new';
  });

  try {
    const routines = await window.FITTRACK.getRoutines();
    
    if (routines.length === 0) {
      routinesListEl.innerHTML = `
        <div class="card flex-col items-center text-center py-12">
          <i data-lucide="clipboard-list" class="text-color-3 mb-4" style="width: 48px; height: 48px;"></i>
          <h3 class="text-xl font-semibold mb-2">No tienes rutinas</h3>
          <p class="text-color-2 mb-6">Crea tu primera rutina de entrenamiento para empezar a registrar tu progreso.</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/routine/new'">Crear Rutina</button>
        </div>
      `;
    } else {
      routinesListEl.innerHTML = routines.map(r => `
        <div class="card card-interactive" onclick="window.location.hash='#/routine/view/${r.id}'">
          <div class="flex-row justify-between items-start mb-2">
            <div class="flex-col gap-1">
              <h3 class="text-lg font-bold">${r.name}</h3>
              ${r.isShared ? `<span class="badge badge-primary" style="font-size:0.68rem; padding: 2px 8px;"><i data-lucide="share-2" style="width:10px;height:10px;margin-right:4px;"></i> Enviada por ${r.senderName || r.senderEmail}</span>` : ''}
            </div>
            <i data-lucide="chevron-right" class="text-color-3"></i>
          </div>
          <p class="text-color-2 text-sm mb-3">${r.description || 'Sin descripción'}</p>
          <div class="flex-row gap-2 flex-wrap items-center justify-between">
            <span class="badge">
              <i data-lucide="dumbbell" style="width: 12px; height: 12px; margin-right: 4px;"></i>
              ${r.exercises ? r.exercises.length : 0} ejercicios
            </span>
            ${r.isShared ? `
              <button class="btn btn-secondary btn-sm btn-import-shared" data-id="${r.id}" onclick="event.stopPropagation();" style="padding:0.25rem 0.6rem; font-size:0.75rem;">
                <i data-lucide="download" style="width:12px;height:12px;"></i> Importar
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');

      // Add listener to import buttons
      document.querySelectorAll('.btn-import-shared').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const sharedId = e.currentTarget.getAttribute('data-id');
          btn.disabled = true;
          btn.innerHTML = '<div class="spinner"></div>';
          try {
            await window.FITTRACK.importSharedRoutine(sharedId);
            alert('¡Rutina importada con éxito a tus rutinas!');
            window.FITTRACK.screens.renderRoutines(container);
          } catch(err) {
            alert('Error al importar: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="download" style="width:12px;height:12px;"></i> Importar';
          }
        });
      });
    }

    if (window.lucide) lucide.createIcons();

  } catch (error) {
    routinesListEl.innerHTML = `
      <div class="card p-4" style="border-color: var(--color-error);">
        Error al cargar rutinas: ${error.message}
      </div>
    `;
  }
};

// ==========================================
// RENDERING ROUTINE CREATION/EDITION
// ==========================================
window.FITTRACK.screens.renderRoutineForm = async function(container, isEditing = false, routineId = null) {
  let routineData = { name: '', description: '', assignedEmail: '', exercises: [] };
  
  container.innerHTML = `
    <div class="flex-row justify-between items-center mb-6">
      <div class="flex-row items-center gap-3">
        <button class="btn-icon text-color-2" onclick="window.history.back()">
          <i data-lucide="arrow-left"></i>
        </button>
        <h1 class="text-2xl font-bold">${isEditing ? 'Editar Rutina' : 'Nueva Rutina'}</h1>
      </div>
      <button id="btn-save-routine" class="btn btn-primary">Guardar</button>
    </div>
    
    <div id="form-content">
      <div class="flex-col items-center py-8"><div class="spinner"></div></div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  if (isEditing && routineId) {
    try {
      routineData = await window.FITTRACK.getRoutine(routineId);
    } catch (e) {
      document.getElementById('form-content').innerHTML = `<p class="text-error">Error cargando rutina</p>`;
      return;
    }
  }

  const renderFormUI = () => {
    document.getElementById('form-content').innerHTML = `
      <div class="card mb-6">
        <div class="form-group">
          <label class="form-label">Nombre de la Rutina</label>
          <input type="text" id="routine-name" class="input-control" placeholder="Ej: Torso / Pierna" value="${routineData.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción (Opcional)</label>
          <input type="text" id="routine-desc" class="input-control" placeholder="Ej: Enfoque hipertrofia" value="${routineData.description || ''}">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Enviar a Pareja / Amigo (Email opcional)</label>
          <input type="email" id="routine-assigned-email" class="input-control" placeholder="ejemplo@pareja.com" value="${routineData.assignedEmail || ''}">
          <span class="text-xs text-color-3 mt-1" style="display:block;">Al guardar, esta rutina se enviará directamente a su cuenta de FITTRACK.</span>
        </div>
      </div>
      
      <div class="flex-row justify-between items-center mb-4">
        <h3 class="text-lg font-bold">Ejercicios</h3>
        <button id="btn-add-exercise" class="btn btn-primary btn-sm" style="padding: 0.5rem 1rem; font-size: var(--font-size-sm);">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Añadir
        </button>
      </div>

      <div id="exercises-list" class="flex-col gap-3 mb-8">
        ${routineData.exercises.length === 0 ? '<p class="text-color-3 text-sm text-center py-4">No hay ejercicios aún.</p>' : ''}
        ${routineData.exercises.map((ex, i) => `
          <div class="card p-3 flex-col gap-2">
            <div class="flex-row justify-between items-center">
              <div class="flex-col gap-1">
                <span class="font-semibold text-color-1">${i + 1}. ${ex.name}</span>
                <span class="text-xs" style="color: var(--color-primary); font-weight:600; text-transform:uppercase; letter-spacing:0.06em;">${ex.type === 'fuerza' ? 'Fuerza' : ex.type === 'cinta' ? 'Cinta' : 'Aeróbico'}</span>
              </div>
              <button class="btn-icon text-error btn-remove-ex" data-index="${i}"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
            </div>
            <div class="flex-row gap-4 text-sm text-color-2">
              ${ex.type === 'fuerza' ? `<span>${ex.sets || '—'} series</span><span>•</span><span>${ex.reps || '—'} reps</span>${ex.rest ? `<span>•</span><span>${ex.rest}s desc.</span>` : ''}` : ''}
              ${ex.type === 'cinta' ? `${ex.time ? `<span>${ex.time} min</span>` : ''}${ex.distance ? `<span>•</span><span>${ex.distance} km</span>` : ''}${ex.speed ? `<span>•</span><span>${ex.speed} km/h</span>` : ''}` : ''}
              ${ex.type === 'aerobico' ? `<span>${ex.modality || ''}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Add exercise → opens premium modal
    document.getElementById('btn-add-exercise').addEventListener('click', () => {
      window.FITTRACK.openExerciseModal(null, (newEx) => {
        routineData.exercises.push(newEx);
        renderFormUI();
      }, null);
    });

    // Remove exercise
    document.querySelectorAll('.btn-remove-ex').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        routineData.exercises.splice(idx, 1);
        renderFormUI();
      });
    });
  };

  renderFormUI();

  document.getElementById('btn-save-routine').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const name = document.getElementById('routine-name').value.trim();
    const desc = document.getElementById('routine-desc').value.trim();
    const assignedEmail = document.getElementById('routine-assigned-email') ? document.getElementById('routine-assigned-email').value.trim() : '';

    if (!name) {
      document.getElementById('routine-name').focus();
      return;
    }

    routineData.name = name;
    routineData.description = desc;
    routineData.assignedEmail = assignedEmail;

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';

    try {
      if (isEditing) {
        await window.FITTRACK.updateRoutine(routineId, routineData);
      } else {
        await window.FITTRACK.createRoutine(routineData);
      }
      window.location.hash = '#/routines';
    } catch (err) {
      alert('Error al guardar: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = 'Guardar';
    }
  });
};

// ==========================================
// RENDERING ROUTINE VIEW
// ==========================================
window.FITTRACK.screens.renderRoutineView = async function(container, routineId) {
  container.innerHTML = `<div class="flex-col items-center py-8"><div class="spinner"></div></div>`;

  try {
    const routine = await window.FITTRACK.getRoutine(routineId);
    
    container.innerHTML = `
      <div class="flex-row justify-between items-start mb-6">
        <div class="flex-col gap-1">
          <div class="flex-row items-center gap-2">
            <button class="btn-icon text-color-2" onclick="window.history.back()">
              <i data-lucide="arrow-left"></i>
            </button>
            <h1 class="text-2xl font-bold">${routine.name}</h1>
          </div>
          <p class="text-color-2 pl-10">${routine.description || ''}</p>
        </div>
        <button id="btn-edit-routine" class="btn-icon" style="color: var(--color-primary);">
          <i data-lucide="edit-2"></i>
        </button>
      </div>

      <div class="mb-8">
        <div class="flex-row gap-3 mb-6">
          <button class="btn btn-primary flex-1" onclick="window.location.hash='#/workout'">
            <i data-lucide="play"></i> Iniciar
          </button>
          <button id="btn-share-routine" class="btn btn-secondary flex-1">
            <i data-lucide="share-2"></i> Enviar a Pareja
          </button>
        </div>

        <h3 class="text-lg font-bold mb-4" style="border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">Ejercicios</h3>
        
        <div class="flex-col gap-3" id="routine-exercises-list">
          ${routine.exercises && routine.exercises.length > 0 
            ? routine.exercises.map((ex, i) => `
                <div class="card p-4">
                  <div class="flex-row justify-between items-center mb-2">
                    <div class="flex-col gap-1">
                      <span class="font-semibold text-lg">${i + 1}. ${ex.name}</span>
                      <span class="text-xs" style="color: var(--color-primary); font-weight:600; text-transform:uppercase; letter-spacing:0.06em;">${ex.type === 'fuerza' ? 'Fuerza' : ex.type === 'cinta' ? 'Cinta' : 'Aeróbico'}</span>
                    </div>
                    <button class="btn-icon text-color-3 btn-edit-ex" data-index="${i}" style="font-size:0.8rem;">
                      <i data-lucide="edit-2" style="width:16px;height:16px"></i>
                    </button>
                  </div>
                  <div class="flex-row gap-6 text-color-2 text-sm flex-wrap">
                    ${ex.type === 'fuerza' ? `
                      ${ex.sets ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Series</span><span class="font-medium" style="color:var(--color-text-1)">${ex.sets}</span></div>` : ''}
                      ${ex.reps ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Reps</span><span class="font-medium" style="color:var(--color-text-1)">${ex.reps}</span></div>` : ''}
                      ${ex.weight ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Carga</span><span class="font-medium" style="color:var(--color-text-1)">${ex.weight} kg</span></div>` : ''}
                      ${ex.rest ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Descanso</span><span class="font-medium" style="color:var(--color-text-1)">${ex.rest}s</span></div>` : ''}
                      ${ex.rir ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">RIR</span><span class="font-medium" style="color:var(--color-text-1)">${ex.rir}</span></div>` : ''}
                    ` : ''}
                    ${ex.type === 'cinta' ? `
                      ${ex.time ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Tiempo</span><span class="font-medium" style="color:var(--color-text-1)">${ex.time} min</span></div>` : ''}
                      ${ex.distance ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Distancia</span><span class="font-medium" style="color:var(--color-text-1)">${ex.distance} km</span></div>` : ''}
                      ${ex.speed ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Velocidad</span><span class="font-medium" style="color:var(--color-text-1)">${ex.speed} km/h</span></div>` : ''}
                      ${ex.incline ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Inclinación</span><span class="font-medium" style="color:var(--color-text-1)">${ex.incline}%</span></div>` : ''}
                    ` : ''}
                    ${ex.type === 'aerobico' ? `
                      <div style="width:100%;"><span class="text-sm" style="color:var(--color-text-2)">${ex.modality || ''}</span></div>
                      ${ex.sets ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Series</span><span class="font-medium" style="color:var(--color-text-1)">${ex.sets}</span></div>` : ''}
                      ${ex.reps ? `<div class="flex-col"><span class="text-xs uppercase" style="letter-spacing:.08em;color:var(--color-text-3)">Reps</span><span class="font-medium" style="color:var(--color-text-1)">${ex.reps}</span></div>` : ''}
                    ` : ''}
                  </div>
                  ${ex.notes ? `<p class="text-sm mt-2" style="color:var(--color-text-3); font-style:italic;">${ex.notes}</p>` : ''}
                </div>
              `).join('')
            : '<p class="text-color-3">No hay ejercicios en esta rutina.</p>'
          }
        </div>
      </div>
      
      <div class="flex-row justify-center mt-8">
        <button id="btn-delete-routine" class="btn btn-ghost text-error">Eliminar Rutina</button>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Share routine button handler
    const btnShare = document.getElementById('btn-share-routine');
    if (btnShare) {
      btnShare.addEventListener('click', async () => {
        const targetEmail = await window.FITTRACK.prompt('Ingresa el correo electrónico de tu pareja o amigo:', 'ejemplo@pareja.com', '', 'Enviar Rutina');
        if (targetEmail && targetEmail.trim()) {
          try {
            btnShare.disabled = true;
            btnShare.innerHTML = '<div class="spinner"></div>';
            await window.FITTRACK.shareRoutine(routine, targetEmail.trim());
            await window.FITTRACK.alert(`¡Rutina enviada a ${targetEmail.trim()}! Cuando inicie sesión la verá lista en sus rutinas.`, 'Rutina Enviada');
          } catch(err) {
            await window.FITTRACK.alert('Error al enviar la rutina: ' + err.message, 'Error');
          } finally {
            btnShare.disabled = false;
            btnShare.innerHTML = '<i data-lucide="share-2"></i> Enviar a Pareja';
            if (window.lucide) lucide.createIcons();
          }
        }
      });
    }

    // Edit exercise inline
    document.querySelectorAll('.btn-edit-ex').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        window.FITTRACK.openExerciseModal(routine.exercises[idx], async (updatedEx) => {
          routine.exercises[idx] = updatedEx;
          try {
            await window.FITTRACK.updateRoutine(routineId, routine);
          } catch(err) { console.error(err); }
          window.FITTRACK.screens.renderRoutineView(container, routineId);
        }, null);
      });
    });

    document.getElementById('btn-edit-routine').addEventListener('click', () => {
      window.location.hash = '#/routine/edit/' + routineId;
    });

    document.getElementById('btn-delete-routine').addEventListener('click', async () => {
      const ok = await window.FITTRACK.confirm('¿Estás seguro de eliminar esta rutina?', 'Eliminar Rutina', 'Eliminar', 'Cancelar');
      if (ok) {
        await window.FITTRACK.deleteRoutine(routineId);
        window.location.hash = '#/routines';
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="card p-4" style="border-color: var(--color-error);">
        Error: ${err.message}
        <button class="btn btn-secondary mt-4 btn-block" onclick="window.history.back()">Volver</button>
      </div>
    `;
  }
};

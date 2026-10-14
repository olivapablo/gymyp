# Especificación para implementar las 10 rutinas en la app de gimnasio

## Objetivo

Implementar en la app un total de **10 rutinas de entrenamiento**: 5 rutinas para `Mi rutina` y 5 para `Rutina de mi pareja`. Deben mantenerse separadas visualmente, pero compartir el sistema existente de ejercicios, registro de series y cronómetro de descanso.

**Importante para el agente:** antes de modificar código, inspeccionar la estructura actual de la aplicación y reutilizar sus componentes, estilos, persistencia y cronómetro. No crear una segunda app ni reemplazar funciones existentes que no estén relacionadas con las rutinas.

## Requisitos funcionales

1. Crear dos perfiles o grupos claramente identificados:
   - `Mi rutina`
   - `Rutina de mi pareja`
2. Cada grupo contiene cinco sesiones, en este orden:
   1. Superior
   2. Inferior
   3. Empuje
   4. Tracción
   5. Piernas
3. Mostrar el nombre de cada ejercicio y, como mínimo, estos datos visibles:
   - Series efectivas.
   - Rango de repeticiones.
   - Descanso entre series.
4. Integrar los descansos con el **cronómetro que ya existe** en la aplicación. Leer la duración desde `rest_seconds` de cada ejercicio; no codificar un único descanso global para todos los ejercicios.
5. Cuando el usuario marque una serie como completada, iniciar el cronómetro de descanso usando los segundos asignados a ese ejercicio, siempre que queden series por completar en ese ejercicio. No iniciar automáticamente un descanso después de la última serie del ejercicio. Si la app ya tiene una interacción de cronómetro diferente, conservar su flujo y conectar los nuevos valores a esa lógica existente.
6. Mostrar el tiempo en un formato fácil de leer, por ejemplo `02:30` para 150 segundos. Permitir usar los controles actuales del cronómetro (iniciar, pausar, reanudar o reiniciar) sin romperlos.
7. Permitir marcar las series completadas de forma independiente para cada ejercicio y sesión. No dar por completada una rutina solo por abrirla.
8. La rutina activa y el progreso de una persona no deben mezclarse con los de la otra. Usar identificadores únicos por rutina y persona.
9. Mantener el orden de los ejercicios tal como aparece en los datos de abajo.
10. Conservar estos datos como configuración estructurada para que se puedan editar más adelante sin tener que modificar componentes visuales.

## Identidad visual

Usar un color principal distinto para cada persona en tarjetas, distintivos, indicadores de progreso y detalles del encabezado. Mantener contraste legible en tema claro y oscuro si la aplicación ya admite ambos.

- **Mi rutina:** azul eléctrico `#2563EB`.
- **Rutina de mi pareja:** magenta/coral `#DB2777`.
- Texto principal: usar los colores de texto ya definidos por la app; no colocar texto pequeño directamente sobre colores saturados sin comprobar contraste.
- Mostrar siempre también el rótulo `MI RUTINA` o `RUTINA DE MI PAREJA`; el color no debe ser la única forma de distinguir los grupos.
- No teñir toda la interfaz de un color saturado. Usar el color como acento: borde, barra superior, badge, icono o indicador de progreso.

## Esquema de datos recomendado

Implementar los datos con una estructura equivalente a la siguiente. Se puede adaptar la sintaxis al stack existente, pero deben conservarse los campos y valores:

- `id`: identificador estable y único.
- `owner_id`: `me` o `partner`.
- `owner_label`: nombre legible de la persona.
- `color`: color asociado al grupo.
- `day_order`: posición de la rutina dentro del ciclo, del 1 al 5.
- `name`: nombre de la sesión.
- `exercises`: lista ordenada de ejercicios.
- Cada ejercicio contiene `id`, `name`, `sets`, `reps`, `rest_seconds` y, cuando corresponda, `notes`.
- `sets` es el número de series efectivas de trabajo; **no incluye calentamiento**.
- `reps` es un texto para mostrar, porque puede ser un rango como `8–12` o una indicación por lado.
- `rest_seconds` representa el descanso entre series, en segundos.

## Datos completos de las 10 rutinas

Los datos del bloque JSON siguiente son la fuente de verdad para implementar nombres, orden, series, repeticiones y descansos.

```json
{
  "owners": [
    {
      "id": "me",
      "label": "Mi rutina",
      "color": "#2563EB"
    },
    {
      "id": "partner",
      "label": "Rutina de mi pareja",
      "color": "#DB2777"
    }
  ],
  "routines": [
    {
      "id": "me-superior",
      "owner_id": "me",
      "owner_label": "Mi rutina",
      "color": "#2563EB",
      "day_order": 1,
      "name": "Superior",
      "exercises": [
        { "id": "me-sup-01", "name": "Press inclinado en máquina", "sets": 3, "reps": "8–12", "rest_seconds": 150 },
        { "id": "me-sup-02", "name": "Australian pull-ups", "sets": 3, "reps": "8–12", "rest_seconds": 120 },
        { "id": "me-sup-03", "name": "Remo con barra", "sets": 3, "reps": "8–12", "rest_seconds": 150 },
        { "id": "me-sup-04", "name": "Peck deck", "sets": 2, "reps": "12–15", "rest_seconds": 75 },
        { "id": "me-sup-05", "name": "Vuelos laterales", "sets": 3, "reps": "12–20", "rest_seconds": 60 },
        { "id": "me-sup-06", "name": "Extensión de tríceps sobre la cabeza", "sets": 2, "reps": "10–15", "rest_seconds": 75 },
        { "id": "me-sup-07", "name": "Curl de bíceps", "sets": 2, "reps": "10–15", "rest_seconds": 75 }
      ]
    },
    {
      "id": "me-inferior",
      "owner_id": "me",
      "owner_label": "Mi rutina",
      "color": "#2563EB",
      "day_order": 2,
      "name": "Inferior",
      "exercises": [
        { "id": "me-inf-01", "name": "Curl femoral acostado", "sets": 3, "reps": "10–15", "rest_seconds": 90 },
        { "id": "me-inf-02", "name": "Sentadilla con barra", "sets": 3, "reps": "6–10", "rest_seconds": 180 },
        { "id": "me-inf-03", "name": "Peso muerto rumano", "sets": 3, "reps": "8–10", "rest_seconds": 150 },
        { "id": "me-inf-04", "name": "Extensiones de cuádriceps", "sets": 2, "reps": "10–15", "rest_seconds": 75 },
        { "id": "me-inf-05", "name": "Aperturas unilaterales en polea", "sets": 3, "reps": "12–20 por lado", "rest_seconds": 60, "notes": "Ejercicio escrito según la lista original. Confirmar con el usuario qué movimiento quiso indicar: las aperturas de pecho suelen ubicarse en Superior/Empuje; si se trata de un ejercicio de glúteo, actualizar el nombre sin alterar la estructura de datos." },
        { "id": "me-inf-06", "name": "Elevaciones de gemelos", "sets": 3, "reps": "10–15", "rest_seconds": 75 }
      ]
    },
    {
      "id": "me-empuje",
      "owner_id": "me",
      "owner_label": "Mi rutina",
      "color": "#2563EB",
      "day_order": 3,
      "name": "Empuje",
      "exercises": [
        { "id": "me-emp-01", "name": "Press de banco en máquina", "sets": 3, "reps": "6–8", "rest_seconds": 150 },
        { "id": "me-emp-02", "name": "Press militar en máquina", "sets": 3, "reps": "8–12", "rest_seconds": 120 },
        { "id": "me-emp-03", "name": "Aperturas en peck deck", "sets": 2, "reps": "10–15", "rest_seconds": 75 },
        { "id": "me-emp-04", "name": "Elevaciones laterales con mancuernas", "sets": 3, "reps": "12–20", "rest_seconds": 60 },
        { "id": "me-emp-05", "name": "Extensiones de tríceps en polea sobre la cabeza", "sets": 3, "reps": "10–15", "rest_seconds": 75 },
        { "id": "me-emp-06", "name": "Patadas de tríceps", "sets": 2, "reps": "12–20", "rest_seconds": 60 }
      ]
    },
    {
      "id": "me-traccion",
      "owner_id": "me",
      "owner_label": "Mi rutina",
      "color": "#2563EB",
      "day_order": 4,
      "name": "Tracción",
      "exercises": [
        { "id": "me-tra-01", "name": "Jalón al pecho con agarre cerrado", "sets": 3, "reps": "8–12", "rest_seconds": 120 },
        { "id": "me-tra-02", "name": "Remo en máquina o con barra", "sets": 3, "reps": "8–12", "rest_seconds": 150 },
        { "id": "me-tra-03", "name": "Remo en polea con agarre cerrado", "sets": 2, "reps": "10–15", "rest_seconds": 90 },
        { "id": "me-tra-04", "name": "Aperturas con mancuernas (inversas si se refiere a deltoides posteriores)", "sets": 3, "reps": "12–20", "rest_seconds": 60, "notes": "El nombre se conserva cerca de la indicación original. Si el ejercicio es una apertura de pecho convencional, debería moverse a una sesión de Empuje; si son aperturas inversas, dejarlo en Tracción." },
        { "id": "me-tra-05", "name": "Encogimientos de hombros", "sets": 2, "reps": "10–15", "rest_seconds": 90 },
        { "id": "me-tra-06", "name": "Curl de bíceps con mancuernas", "sets": 2, "reps": "8–12", "rest_seconds": 75 },
        { "id": "me-tra-07", "name": "Curl predicador unilateral con mancuerna", "sets": 2, "reps": "10–15 por brazo", "rest_seconds": 75 }
      ]
    },
    {
      "id": "me-piernas",
      "owner_id": "me",
      "owner_label": "Mi rutina",
      "color": "#2563EB",
      "day_order": 5,
      "name": "Piernas",
      "exercises": [
        { "id": "me-pie-01", "name": "Peso muerto convencional", "sets": 1, "reps": "4–6", "rest_seconds": 180, "notes": "Una sola serie efectiva, como se indicó originalmente. No llevar al fallo técnico." },
        { "id": "me-pie-02", "name": "Peso muerto rumano", "sets": 3, "reps": "8–10", "rest_seconds": 150 },
        { "id": "me-pie-03", "name": "Prensa a 45°", "sets": 3, "reps": "10–15", "rest_seconds": 150 },
        { "id": "me-pie-04", "name": "Extensiones de cuádriceps", "sets": 2, "reps": "12–15", "rest_seconds": 75 },
        { "id": "me-pie-05", "name": "Curl femoral acostado", "sets": 3, "reps": "10–15", "rest_seconds": 90 },
        { "id": "me-pie-06", "name": "Elevaciones de gemelos", "sets": 3, "reps": "12–20", "rest_seconds": 75 }
      ]
    },
    {
      "id": "partner-superior",
      "owner_id": "partner",
      "owner_label": "Rutina de mi pareja",
      "color": "#DB2777",
      "day_order": 1,
      "name": "Superior",
      "exercises": [
        { "id": "partner-sup-01", "name": "Press inclinado en máquina", "sets": 3, "reps": "8–12", "rest_seconds": 150 },
        { "id": "partner-sup-02", "name": "Australian pull-ups", "sets": 3, "reps": "8–12", "rest_seconds": 120 },
        { "id": "partner-sup-03", "name": "Remo con barra", "sets": 3, "reps": "8–12", "rest_seconds": 150 },
        { "id": "partner-sup-04", "name": "Peck deck", "sets": 2, "reps": "12–15", "rest_seconds": 75 },
        { "id": "partner-sup-05", "name": "Vuelos laterales", "sets": 3, "reps": "12–20", "rest_seconds": 60 },
        { "id": "partner-sup-06", "name": "Extensión de tríceps sobre la cabeza", "sets": 2, "reps": "10–15", "rest_seconds": 75 },
        { "id": "partner-sup-07", "name": "Curl de bíceps", "sets": 2, "reps": "10–15", "rest_seconds": 75 }
      ]
    },
    {
      "id": "partner-inferior",
      "owner_id": "partner",
      "owner_label": "Rutina de mi pareja",
      "color": "#DB2777",
      "day_order": 2,
      "name": "Inferior",
      "exercises": [
        { "id": "partner-inf-01", "name": "Sentadilla con barra", "sets": 3, "reps": "6–10", "rest_seconds": 180 },
        { "id": "partner-inf-02", "name": "Peso muerto rumano", "sets": 3, "reps": "8–10", "rest_seconds": 150 },
        { "id": "partner-inf-03", "name": "Curl femoral acostado", "sets": 3, "reps": "10–15", "rest_seconds": 90 },
        { "id": "partner-inf-04", "name": "Extensiones de cuádriceps", "sets": 2, "reps": "10–15", "rest_seconds": 75 },
        { "id": "partner-inf-05", "name": "Hip thrust con barra o máquina", "sets": 3, "reps": "8–12", "rest_seconds": 150 },
        { "id": "partner-inf-06", "name": "Elevaciones de gemelos", "sets": 3, "reps": "10–15", "rest_seconds": 75 }
      ]
    },
    {
      "id": "partner-empuje",
      "owner_id": "partner",
      "owner_label": "Rutina de mi pareja",
      "color": "#DB2777",
      "day_order": 3,
      "name": "Empuje",
      "exercises": [
        { "id": "partner-emp-01", "name": "Press de banco en máquina", "sets": 3, "reps": "6–8", "rest_seconds": 150 },
        { "id": "partner-emp-02", "name": "Press militar en máquina", "sets": 3, "reps": "8–12", "rest_seconds": 120 },
        { "id": "partner-emp-03", "name": "Aperturas en peck deck", "sets": 2, "reps": "10–15", "rest_seconds": 75 },
        { "id": "partner-emp-04", "name": "Elevaciones laterales con mancuernas", "sets": 3, "reps": "12–20", "rest_seconds": 60 },
        { "id": "partner-emp-05", "name": "Extensiones de tríceps en polea sobre la cabeza", "sets": 3, "reps": "10–15", "rest_seconds": 75 },
        { "id": "partner-emp-06", "name": "Patadas de tríceps", "sets": 2, "reps": "12–20", "rest_seconds": 60 }
      ]
    },
    {
      "id": "partner-traccion",
      "owner_id": "partner",
      "owner_label": "Rutina de mi pareja",
      "color": "#DB2777",
      "day_order": 4,
      "name": "Tracción",
      "exercises": [
        { "id": "partner-tra-01", "name": "Jalón al pecho con agarre cerrado", "sets": 3, "reps": "8–12", "rest_seconds": 120 },
        { "id": "partner-tra-02", "name": "Remo en máquina o con barra", "sets": 3, "reps": "8–12", "rest_seconds": 150 },
        { "id": "partner-tra-03", "name": "Remo en polea con agarre cerrado", "sets": 2, "reps": "10–15", "rest_seconds": 90 },
        { "id": "partner-tra-04", "name": "Aperturas inversas con mancuernas", "sets": 3, "reps": "12–20", "rest_seconds": 60 },
        { "id": "partner-tra-05", "name": "Encogimientos de hombros", "sets": 2, "reps": "10–15", "rest_seconds": 90 },
        { "id": "partner-tra-06", "name": "Curl de bíceps con mancuernas", "sets": 2, "reps": "8–12", "rest_seconds": 75 },
        { "id": "partner-tra-07", "name": "Curl predicador unilateral con mancuerna", "sets": 2, "reps": "10–15 por brazo", "rest_seconds": 75 }
      ]
    },
    {
      "id": "partner-piernas",
      "owner_id": "partner",
      "owner_label": "Rutina de mi pareja",
      "color": "#DB2777",
      "day_order": 5,
      "name": "Piernas",
      "exercises": [
        { "id": "partner-pie-01", "name": "Peso muerto convencional", "sets": 1, "reps": "4–6", "rest_seconds": 180, "notes": "Una serie efectiva; requiere experiencia y técnica consistente. Evitar el fallo técnico." },
        { "id": "partner-pie-02", "name": "Prensa a 45°", "sets": 3, "reps": "10–15", "rest_seconds": 150 },
        { "id": "partner-pie-03", "name": "Extensiones de cuádriceps", "sets": 2, "reps": "12–15", "rest_seconds": 75 },
        { "id": "partner-pie-04", "name": "Curl femoral acostado", "sets": 3, "reps": "10–15", "rest_seconds": 90 },
        { "id": "partner-pie-05", "name": "Abducción de cadera en polea o máquina", "sets": 3, "reps": "15–25", "rest_seconds": 60 },
        { "id": "partner-pie-06", "name": "Elevaciones de gemelos", "sets": 3, "reps": "12–20", "rest_seconds": 75 }
      ]
    }
  ]
}
```

## Lógica del cronómetro

- `rest_seconds` siempre representa segundos: `60` = 1:00, `75` = 1:15, `90` = 1:30, `120` = 2:00, `150` = 2:30 y `180` = 3:00.
- El descanso se muestra junto al nombre del ejercicio (por ejemplo, `Descanso: 2:30`).
- Al completar una serie, iniciar el descanso de ese ejercicio solo si quedan más series pendientes en él. Si se completa la última serie, no iniciar automáticamente un descanso innecesario.
- Al cambiar de ejercicio, usar el tiempo del ejercicio nuevo; evitar que quede activo un descanso del ejercicio anterior.
- Al cambiar de una persona o rutina a otra, no mezclar el ejercicio activo ni el contador de descanso. Si el cronómetro ya está corriendo, aplicar el comportamiento seguro que use actualmente la app y confirmar visualmente qué rutina está activa.
- Si el usuario puede editar el tiempo desde el cronómetro actual, dejar que su ajuste manual tenga efecto durante esa sesión; el valor de configuración original debe seguir siendo el de `rest_seconds`.

## Reglas para el registro de series

- Cada ejercicio debe mostrar exactamente tantas filas o controles de serie como indique `sets`.
- Las repeticiones son un objetivo orientativo y deben mostrarse literalmente, incluidos rangos y textos como `por brazo` o `por lado`.
- Si el registro actual permite anotar carga y repeticiones realizadas, mantener esa funcionalidad y guardar esos valores por persona, rutina, ejercicio y fecha.
- El progreso debe calcularse por series completadas, por ejemplo `5/7 series`, y reflejarse en la tarjeta de la rutina.
- No compartir el progreso entre las rutinas de las dos personas aunque los ejercicios tengan el mismo nombre.

## Distribución semanal sugerida

La app puede mostrar las sesiones en orden de ciclo, sin imponer días calendario fijos:

1. Superior
2. Inferior
3. Descanso
4. Empuje
5. Tracción
6. Piernas
7. Descanso

Repetir el ciclo. Los días de descanso son una referencia y no necesitan figurar como rutinas de ejercicios dentro del recuento de diez.

## Criterios de aceptación

Considerar la implementación completa cuando:

- [ ] Existen exactamente 10 rutinas: 5 con `owner_id: "me"` y 5 con `owner_id: "partner"`.
- [ ] Las tarjetas o encabezados permiten distinguir las dos personas por color, etiqueta y texto.
- [ ] Cada ejercicio muestra nombre, series, repeticiones y descanso.
- [ ] El cronómetro existente toma la duración correcta de cada ejercicio.
- [ ] El cronómetro no inicia un descanso automático tras la última serie de un ejercicio.
- [ ] Cambiar entre personas o rutinas no mezcla progreso ni temporizador.
- [ ] Se conserva el estilo y la arquitectura de la app existente.
- [ ] Se verifica que el recuento visual y el guardado de progreso funcionen en las diez rutinas.

## Notas de entrenamiento

- Las series indicadas son series efectivas y no incluyen calentamiento.
- Los descansos son referencias prácticas: se puede ampliar el tiempo si hace falta para recuperar la técnica y el rendimiento.
- En ejercicios multiarticulares exigentes, mantener buena técnica y evitar el fallo técnico, especialmente en peso muerto y sentadilla.
- Dos nombres de la lista original de `Mi rutina` necesitan confirmación del usuario: `Aperturas unilaterales en polea` en Inferior y `Aperturas con mancuernas` en Tracción. Mantener los nombres/anotaciones por ahora y no cambiar la selección en silencio.

# Spec: Entrenamientos — Phase 2 (Field Editor + Templates)

## Domain: training-sessions (Modified)

### ADDED Requirements

#### Requirement: Session diagram storage

The TrainingSession model MUST support an optional `diagram` JSON column storing an array of field items with coordinates, types, rotation, and labels.

The system MUST serialize the current FieldEditor state into `{ items: FieldItem[] }` on save and MUST restore it on load. Saving with `diagram: null` MUST clear the field.

- **Scenario: SC-SAVE-1 — Save diagram to session**
  GIVEN a TrainingSession with id "s1" and a FieldEditor with 3 items (cone, ball, arrow)
  WHEN the user clicks "Guardar"
  THEN the system PUTs `/api/training-sessions/s1` with `{ diagram: { items: [...] } }`
  AND the session detail shows a success toast

- **Scenario: SC-SAVE-2 — Load session with diagram**
  GIVEN a TrainingSession with existing diagram JSON in its `diagram` field
  WHEN the session detail page mounts
  THEN the FieldEditor MUST initialize its local state with the parsed items
  AND the items MUST render at their stored positions

- **Scenario: SC-SAVE-3 — Clear diagram**
  GIVEN a TrainingSession with an existing diagram
  WHEN the user places no items and clicks "Guardar"
  THEN the system sends `{ diagram: null }`
  AND the field canvas shows an empty pitch on reload

- **Scenario: SC-SAVE-4 — Invalid item type filtered**
  GIVEN a session diagram JSON containing an item with type "unknown_type"
  WHEN the FieldEditor loads
  THEN the unknown item MUST be filtered out
  AND valid items MUST render normally

### MODIFIED Requirements

*(No previous spec exists — this section records the new diagram-related behavior added to the existing training-sessions domain.)*

#### Requirement: PUT /api/training-sessions/:id accepts diagram

The PUT endpoint MUST accept an optional `diagram` field in the request body alongside existing fields. The diagram MUST be validated as a `FieldDiagram` structure or `null`.

- **Scenario: SC-API-1 — Update session with diagram**
  GIVEN a valid session id
  WHEN a PUT request includes `{ name: "Ejercicio A", diagram: { items: [...] } }`
  THEN the server MUST respond 200 with the updated session containing the diagram

- **Scenario: SC-API-2 — Update session without diagram (backward compat)**
  GIVEN a valid session id
  WHEN a PUT request omits the diagram field
  THEN the server MUST update only the provided fields

- **Scenario: SC-API-3 — Update session diagram to null**
  GIVEN a session with an existing diagram
  WHEN a PUT request includes `{ diagram: null }`
  THEN the server MUST set the diagram to null in the database

---

## Domain: exercise-templates (New)

### Purpose

Allow coaches to create, list, and delete reusable exercise diagrams independent of specific training sessions. Templates serve as a library of common drills that can be loaded into any session's FieldEditor.

### Requirements

#### Requirement: Template CRUD — create

The system MUST support creating a named exercise template from a current field diagram via `POST /api/exercise-templates`.

The request body MUST contain `name` (string, required) and `diagram` (FieldDiagram, required). The server MUST respond with 201 and the created template. Templates MUST be scoped to the authenticated user.

- **Scenario: SC-TMPL-1 — Create template**
  GIVEN a user is authenticated with a FieldEditor showing 5 items
  WHEN the user clicks "Guardar como plantilla", enters "Rondo 4v2", and confirms
  THEN the system POSTs `/api/exercise-templates` with `{ name: "Rondo 4v2", diagram: { items: [...] } }`
  AND the server responds 201 with the created template
  AND the modal shows a confirmation message

- **Scenario: SC-TMPL-2 — Create template without name**
  GIVEN the user clicks "Guardar como plantilla"
  WHEN the user submits with an empty name
  THEN the modal MUST show a validation error
  AND the POST MUST NOT be sent

- **Scenario: SC-TMPL-3 — Create template with empty diagram**
  GIVEN a FieldEditor with no items
  WHEN the user clicks "Guardar como plantilla"
  THEN the system SHOULD warn: "El campo está vacío. ¿Guardar de todas formas?"
  AND if confirmed, proceed with POST

#### Requirement: Template CRUD — list

The system MUST list all templates owned by the authenticated user via `GET /api/exercise-templates`, ordered by name ascending. Each template MUST include id, name, diagram, createdAt, updatedAt.

- **Scenario: SC-TMPL-4 — List templates**
  GIVEN a user has 3 saved templates
  WHEN the "Cargar plantilla" modal opens
  THEN the system GETs `/api/exercise-templates`
  AND the modal displays templates ordered alphabetically by name

- **Scenario: SC-TMPL-5 — No templates**
  GIVEN a user has no saved templates
  WHEN the "Cargar plantilla" modal opens
  THEN the modal MUST show "No tienes plantillas guardadas"

#### Requirement: Template CRUD — delete

The system MUST delete a template owned by the authenticated user via `DELETE /api/exercise-templates/:id`, responding with 204 on success. Deleting another user's template MUST return 404.

- **Scenario: SC-TMPL-6 — Delete template**
  GIVEN a user viewing their template list with template "t1"
  WHEN the user clicks delete and confirms
  THEN the system DELETE `/api/exercise-templates/t1`
  AND the server responds 204
  AND the template is removed from the list

- **Scenario: SC-TMPL-7 — Delete another user's template**
  GIVEN a template owned by user "A"
  WHEN user "B" sends DELETE `/api/exercise-templates/t1`
  THEN the server MUST respond 404

#### Requirement: Load template into FieldEditor

The system MUST allow loading a template's diagram into the FieldEditor, replacing all current items.

- **Scenario: SC-TMPL-8 — Load template replaces items**
  GIVEN a FieldEditor with 2 existing items
  WHEN the user selects template "Rondo 4v2" and confirms "¿Cargar plantilla? Se reemplazarán los elementos actuales"
  THEN the FieldEditor replaces its items with the template's diagram
  AND the canvas re-renders with template items

---

## Domain: FieldEditor UI (Cross-cutting)

### Requirements

#### Requirement: Field Canvas rendering

The FieldCanvas MUST render an SVG football pitch with viewBox="0 0 100 100" and preserveAspectRatio="xMidYMid meet". The pitch MUST display: green fill, white outer boundary, halfway line, center circle (radius 10% of width), two penalty areas, two goal areas, center spot, and two penalty spots.

Items MUST render as SVG children at their x,y percentage coordinates.

- **Scenario: SC-UI-1 — Empty pitch renders**
  GIVEN a session with no diagram
  WHEN the FieldEditor mounts
  THEN the FieldCanvas shows a full pitch with markings and no items

- **Scenario: SC-UI-2 — Items render at correct positions**
  GIVEN diagram items at x=50, y=50
  WHEN the FieldCanvas renders
  THEN each item's SVG element has the correct transform/position matching its x,y percentages

#### Requirement: Item interaction — place, select, move, rotate, delete

The FieldEditor MUST support placing items via toolbox selection + canvas click, selecting items by click, moving by drag, rotating arrows/players via rotation handle, and deleting via Delete key or toolbox button.

- **Scenario: SC-F1 — Place cone**
  GIVEN the cone tool is active in the toolbox
  WHEN the user clicks the field at (40, 60)
  THEN a cone item appears at x=40, y=60 with rotation=0

- **Scenario: SC-F2 — Move item**
  GIVEN an item at (50, 50)
  WHEN the user drags it to (70, 30)
  THEN the item's x updates to 70 and y to 30 in real time

- **Scenario: SC-F3 — Rotate arrow**
  GIVEN an arrow item selected
  WHEN the user drags the rotation handle
  THEN the arrow's rotation updates in real time to match the handle angle

- **Scenario: SC-F4 — Delete selected item**
  GIVEN an item is selected
  WHEN the user presses Delete
  THEN the item is removed from the local state

- **Scenario: SC-F5 — Select and deselect**
  GIVEN no items selected
  WHEN the user clicks an existing cone
  THEN the cone shows a blue dashed selection ring
  WHEN the user clicks an empty area
  THEN the selection ring disappears

#### Requirement: Template modals

The system MUST provide two modals: one for saving the current diagram as a template (name input required), and one for loading a template from the user's library (list with confirmation dialog).

- **Scenario: SC-F6 — Save as template**
  GIVEN the FieldEditor has items
  WHEN the user clicks "Guardar como plantilla", enters "Pases cortos", and submits
  THEN a new template is created via POST
  AND the modal closes with a success message

- **Scenario: SC-F7 — Load template**
  GIVEN the "Cargar plantilla" modal is open showing template list
  WHEN the user clicks a template and confirms replacement
  THEN the FieldEditor loads the template's items
  AND the modal closes

- **Scenario: SC-F8 — Cancel load**
  GIVEN the "Cargar plantilla" modal shows "¿Cargar plantilla?" confirmation
  WHEN the user clicks "Cancelar"
  THEN items remain unchanged
  AND the modal closes

- **Scenario: SC-F9 — Delete template from list**
  GIVEN the "Cargar plantilla" modal is open
  WHEN the user clicks the delete icon on a template row and confirms
  THEN the template is deleted via DELETE API
  AND the list updates to remove it

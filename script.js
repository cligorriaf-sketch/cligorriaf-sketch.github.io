// script.js - versión con DI + historial de estados y animación visible

// Estados q0..q8
const Q = {
  q0: 'q0',
  q1: 'q1',
  q2: 'q2',
  q3: 'q3', // aceptación final
  q4: 'q4',
  q5: 'q5',
  q6: 'q6',
  q7: 'q7', // rechazo
  q8: 'q8'  // estado intermedio antes de aceptar (según tu diagrama)
};

let tape = [];
let head = 0;
let state = Q.q0;
let running = false;
let stepDelay = 220;           // ajuste visible de animación
let compareSymbol = null;      // guarda '0' o '1' que marcamos en la primera cadena
let statePath = [state];       // historial de estados
let diList = [];               // lista de Descripciones Instantáneas (DI)

// UI refs (esperan que el HTML tenga estos ids)
const tapeDiv = document.getElementById('tape');
const stateSpan = document.getElementById('state');
const headSpan = document.getElementById('headPos');
const statusDiv = document.getElementById('status');
const historyDiv = document.getElementById('history');

// Si no existe un contenedor para DI en el HTML, lo creamos
let diDiv = document.getElementById('di');
if (!diDiv) {
  diDiv = document.createElement('div');
  diDiv.id = 'di';
  diDiv.style.marginTop = '12px';
  diDiv.style.padding = '8px';
  diDiv.style.borderRadius = '6px';
  diDiv.style.border = '1px solid #e0e0e0';
  diDiv.style.maxHeight = '220px';
  diDiv.style.overflow = 'auto';
  diDiv.style.background = '#fafafa';
  const title = document.createElement('div');
  title.innerHTML = '<b>Descripciones instantáneas (DI)</b>';
  diDiv.appendChild(title);
  document.body.appendChild(diDiv);
}

// helpers movimiento
function moveRight() { head++; if (head >= tape.length) tape.push('_'); }
function moveLeft() { if (head > 0) head--; else { tape.unshift('_'); head = 0; } }

// snapshot de cinta para DI: muestra el contenido y marca la celda del cabezal con [^]
function snapshotTapeForDI() {
  // Representa la cinta como string con el cabezal señalado
  // Ej: _ 1 X 0 [^] 1 _  => concatenación legible
  const parts = tape.map((c, idx) => {
    if (idx === head) return `[${c}]`; // marca la celda actual con corchetes
    return ` ${c} `;
  });
  return parts.join('');
}

// añadir una entrada DI
function pushDI() {
  const di = {
    estado: state,
    headPos: head,
    tapeView: snapshotTapeForDI()
  };
  diList.push(di);
  renderDI();
}

// render lista DI
function renderDI() {
  // diDiv conserva el título en la primera posición
  // borrar entradas antiguas (dejamos el primer elemento que es el título)
  diDiv.innerHTML = '<b>Descripciones instantáneas (DI)</b>';
  const list = document.createElement('ol');
  list.style.paddingLeft = '18px';
  list.style.margin = '8px 0 0 0';
  for (let i = 0; i < diList.length; i++) {
    const d = diList[i];
    const li = document.createElement('li');
    li.style.fontFamily = 'monospace';
    li.style.fontSize = '0.95rem';
    li.style.marginBottom = '6px';
    li.textContent = `${d.estado} | head=${d.headPos} | ${d.tapeView}`;
    list.appendChild(li);
  }
  diDiv.appendChild(list);
  // auto-scroll para ver lo último
  diDiv.scrollTop = diDiv.scrollHeight;
}

// inicializa máquina
function resetMachine() {
  tape = [];
  head = 0;
  state = Q.q0;
  running = false;
  compareSymbol = null;
  statePath = [state];
  diList = [];
  renderTape();
  updateStatus();
  updateHistory();
  renderDI();
}

// carga entrada (valida 0/1 y un separador)
function loadInput(str) {
  str = str.trim().replace(/\s+/g, ' ');
  if (!str.includes(' ')) {
    alert('Debe contener dos cadenas separadas por un espacio. Ej: 101 101');
    return false;
  }
  const parts = str.split(' ');
  if (!/^[01]*$/.test(parts[0]) || !/^[01]*$/.test(parts[1])) {
    alert('Solo se permiten símbolos 0 y 1 en las cadenas.');
    return false;
  }

  tape = ['_'];
  for (let ch of str) tape.push(ch);
  tape.push('_');
  head = 1;           // comienza en primer símbolo de la entrada
  state = Q.q0;
  running = false;
  compareSymbol = null;
  statePath = [state];
  diList = [];
  renderTape();
  updateStatus();
  updateHistory();
  renderDI();
  // Push primera DI (estado inicial)
  pushDI();
  return true;
}

// pinta cinta
function renderTape() {
  tapeDiv.innerHTML = '';
  for (let i = 0; i < tape.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell' + (i === head ? ' head' : '');
    cell.textContent = tape[i];
    tapeDiv.appendChild(cell);
  }
}

// actualiza estado y resultado visual
function updateStatus() {
  stateSpan.textContent = state;
  headSpan.textContent = head;
  updateHistory();

  if (state === Q.q3) {
    statusDiv.className = 'status accept';
    statusDiv.innerHTML = '✅ <b>Cadena Aceptada</b>';
  } else if (state === Q.q7) {
    statusDiv.className = 'status reject';
    statusDiv.innerHTML = '❌ <b>Cadena Rechazada</b>';
  } else {
    statusDiv.className = 'status info';
    statusDiv.innerHTML = 'Estado actual: <b>' + state + '</b> — Cabezal en posición: <b>' + head + '</b>';
  }
}

// mostrar historial
function updateHistory() {
  if (!historyDiv) return;
  historyDiv.innerHTML = '<b>Secuencia de estados:</b> ' + statePath.join(' → ');
}

// step: transición única acorde a tu diagrama q0..q8
function step() {
  const sym = tape[head];

  // si ya haló no hace nada
  if (state === Q.q3 || state === Q.q7) return;

  // ---------- Lógica de la MT (q0..q8) ----------
  // q0: buscar primer símbolo sin marcar en la primera cadena
  if (state === Q.q0) {
    if (sym === '1') {
      compareSymbol = '1';
      tape[head] = 'B';   // marcar 1 en izquierda
      state = Q.q2;       // q0 -> q2 para 1
      moveRight();
    } else if (sym === '0') {
      compareSymbol = '0';
      tape[head] = 'A';   // marcar 0 en izquierda
      state = Q.q1;       // q0 -> q1 para 0
      moveRight();
    } else if (sym === 'A' || sym === 'B') {
      // ya marcado, seguir avanzando
      moveRight();
    } else if (sym === ' ') {
      // primera cadena marcada
      state = Q.q8;
      moveRight();
    } else if (sym === '_') {
      // cinta vacía
      state = Q.q3; // aceptar
    } else {
      state = Q.q7;
    }
  }

  // q1: cruzar separador hasta la segunda cadena y luego q4
  else if (state === Q.q1) {
    if (sym !== ' ') moveRight();
    else { moveRight(); state = Q.q4; }
  }

  // q2: cruzar separador hasta la segunda cadena y luego q6
  else if (state === Q.q2) {
    if (sym !== ' ') moveRight();
    else { moveRight(); state = Q.q6; }
  }

  // q4: buscar '0' en la segunda cadena
  else if (state === Q.q4) {
    if (sym === 'A' || sym === 'B') moveRight();
    else if (sym === '0' || sym === '1') {
      if (sym === compareSymbol) {
        tape[head] = (sym === '0') ? 'A' : 'B';
        state = Q.q5;
        moveLeft();
      } else { state = Q.q7; }
    } else if (sym === '_') { state = Q.q7; }
    else moveRight();
  }

  // q6: buscar '1' en la segunda cadena
  else if (state === Q.q6) {
    if (sym === 'A' || sym === 'B') moveRight();
    else if (sym === '0' || sym === '1') {
      if (sym === compareSymbol) {
        tape[head] = (sym === '0') ? 'A' : 'B';
        state = Q.q5;
        moveLeft();
      } else { state = Q.q7; }
    } else if (sym === '_') { state = Q.q7; }
    else moveRight();
  }

  // q5: regresar hacia la izquierda hasta el blanco izquierdo, luego avanzar 1 y volver a q0
  else if (state === Q.q5) {
    if (sym !== '_') moveLeft();
    else { moveRight(); state = Q.q0; compareSymbol = null; }
  }

  // q8: primera cadena marcada; verificar la segunda y luego q3
  else if (state === Q.q8) {
    if (sym === 'A' || sym === 'B') moveRight();
    else if (sym === '0' || sym === '1') state = Q.q7;
    else if (sym === '_') state = Q.q3;
    else moveRight();
  }

  // fin transiciones

  // registrar estado si cambió
  const last = statePath[statePath.length - 1];
  if (last !== state) statePath.push(state);

  // registrar DI (antes de renderizar) para que la snapshot muestre cambios actuales
  pushDI();

  // renderizar UI
  renderTape();
  updateStatus();
}

// Ejecutar todo hasta halting (q3 o q7)
async function runAll() {
  running = true;
  while (running && state !== Q.q3 && state !== Q.q7) {
    step();
    await new Promise(r => setTimeout(r, stepDelay));
  }
  running = false;
}

// UI bindings
document.getElementById('loadBtn').addEventListener('click', () => {
  const s = document.getElementById('inputW').value;
  if (loadInput(s)) {
    renderTape();
    updateStatus();
  }
});
document.getElementById('stepBtn').addEventListener('click', () => {
  step();
});
document.getElementById('runBtn').addEventListener('click', () => {
  runAll();
});
document.getElementById('resetBtn').addEventListener('click', () => {
  resetMachine();
  document.getElementById('inputW').value = '';
});

// Inicializa con valor por defecto si existe
if (document.getElementById('inputW')) {
  loadInput(document.getElementById('inputW').value);
  renderTape();
  updateStatus();
}





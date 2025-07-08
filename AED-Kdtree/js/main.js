/*  KD-Tree Visual ‒ archivo de interfaz
 *  ------------------------------------
 *  – Inserción / eliminación animada (ya implementado)
 *  – **Nuevo** botón “Undo” para deshacer la última operación
 *    (mantiene un historial de estados del árbol)
 *  ----------------------------------------------------------- */

import { KDTree }                        from "./kd/KDTree.js";
import { setTreeRef, enqueue,
         setAnimationSpeed }            from "./AnimationMain.js";
import { clearCanvas, nodes as vNodes } from "./ObjectManager.js";

/* ─────────────── 1 · Instancia & referencias ─────────────── */
const tree = new KDTree();
setTreeRef( tree );

/* ─────────────── 2 · Historial para Undo ──────────────── */
const history = [];                //  pila LIFO de snapshots

function collectPoints (kdNode, out = []) {         // DFS →  [[x,y],…]
  if (!kdNode) return out;
  out.push( [...kdNode.point] );                    // copia defensiva
  collectPoints(kdNode.left , out);
  collectPoints(kdNode.right, out);
  return out;
}

async function rebuildFrom (pointsArr) {            // rehace árbol sin animar
  /* 1 · reset visual y lógico */
  tree.root = null;
  clearCanvas();
  enqueue({ action:"clearEdges" });

  /* 2 · insertar puntos en modo “rápido / sin animación”
        (KDTree.quickInsert crea nodo y ordena pero NO anima) */
  for (const p of pointsArr) {
    const kdNode = tree.quickInsert(p);              // ← método helper (ver abajo)
    enqueue({ action:"createNode", node: kdNode });  // crear visualmente
  }

  /* 3 · recomputar layout y dibujar aristas */
  enqueue({ action:"reLayout" });
}

/* ─────────────── 3 · Utilidades de entrada ─────────────── */
function readInputs () {
  const x = parseFloat(document.getElementById("x").value);
  const y = parseFloat(document.getElementById("y").value);
  if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
  alert("Introduce números válidos");
  return null;
}

/* ─────────────── 4 · Botones ─────────────── */

/* INSERTAR */
document.getElementById("insert").addEventListener("click", async () => {
  const p = readInputs();
  if (!p) return;
  await tree.insert(p);              // ⬅️ animado
  history.push( collectPoints(tree.root) );   // guardar estado DESPUÉS
});

/* ELIMINAR */
document.getElementById("delete").addEventListener("click", async () => {
  const p = readInputs();
  if (!p) return;
  await tree.delete(p);              // ⬅️ animado
  history.push( collectPoints(tree.root) );   // guardar estado DESPUÉS
});

/* UNDO  (deshacer último) */
document.getElementById("undo").addEventListener("click", async () => {
  if (history.length < 2) return;          //  nada que deshacer (0 o 1 = estado actual)
  history.pop();                           //  descartar estado presente
  const prev = history[history.length - 1];  //  estado anterior
  await rebuildFrom(prev);
});

/* RESET */
document.getElementById("reset").addEventListener("click", () => {
  history.length = 0;                         // vaciar historial
  tree.root = null;
  enqueue({ action:"clearEdges" });
  clearCanvas();
  document.getElementById("x").value = "";
  document.getElementById("y").value = "";
});

/* ────────── 5 · Slider de velocidad (100-1500 ms) ────────── */
const slider = document.getElementById("speedSlider");
setAnimationSpeed( 1600 - Number(slider.value) );           // inicial

slider.addEventListener("input", e => {
  const v      = Number(e.target.value);
  const speed  = 1600 - v;                                   // 1500 → 100 ms  ··· 100 → 1500 ms
  setAnimationSpeed(speed);
});


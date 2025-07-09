/*  KD-Tree Visual ‒ archivo de interfaz
 *  ------------------------------------
 *  – Inserción / eliminación animada (ya implementado)
 *  – **Nuevo** botón “Undo” para deshacer la última operación
 *  – **Nuevo** botón “Partitions” para mostrar el plano 2-D
 *  ----------------------------------------------------------- */

import { KDTree }                        from "./kd/KDTree.js";
import { setTreeRef, enqueue,
         setAnimationSpeed,
         togglePartitions }             from "./AnimationMain.js";
import { clearCanvas }                   from "./ObjectManager.js";

/* ─────────────── 1 · Instancia & referencias ─────────────── */
const tree = new KDTree();
setTreeRef( tree );

/* ─────── NEW: referencia al canvas del plano y flag ─────── */
const planeCanvas = document.getElementById("plane");
let   partsShown  = false;                       // comienza oculto
/* ─────────────────────────────────────────────────────────── */

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
  tree.root = null;
  clearCanvas();
  enqueue({ action:"clearEdges" });

  for (const p of pointsArr) {
    const kdNode = tree.quickInsert(p);             // inserción rápida
    enqueue({ action:"createNode", node: kdNode });
  }
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
  await tree.insert(p);              
  history.push( collectPoints(tree.root) );   
});

/* ELIMINAR */
document.getElementById("delete").addEventListener("click", async () => {
  const p = readInputs();
  if (!p) return;
  await tree.delete(p);              
  history.push( collectPoints(tree.root) );   
});

/* OPTIMIZE  -------------------------------------------------------- */
document.getElementById("optimize").addEventListener("click", async () => {
  if (!tree.root) return;

  /* antes de optimizar, guarda snapshot para poder volver */
  const before = collectPoints(tree.root);
  const snapshotPrev = structuredClone(before);

  /* reconstruye */
  const prevPoints = await tree.optimize();   // devuelve puntos pre-optimiz.

  /* historial: empuja el estado OPTIMIZADO */
  history.push( collectPoints(tree.root) );

  /* y, justo antes, el estado previo (para Undo inmediato) */
  history.splice(history.length-1, 0, snapshotPrev);
});


/* UNDO  */
document.getElementById("undo").addEventListener("click", async () => {
  if (history.length < 2) return;
  history.pop();                           
  const prev = history[history.length - 1];
  await rebuildFrom(prev);
});

/* RESET */
document.getElementById("reset").addEventListener("click", () => {
  history.length = 0;
  tree.root = null;
  enqueue({ action:"clearEdges" });
  clearCanvas();
  document.getElementById("x").value = "";
  document.getElementById("y").value = "";

  /* ── NEW: ocultar plano y reiniciar flag ── */
  partsShown = false;
  planeCanvas.style.display = "none";
});

/* PARTITIONS  (mostrar / ocultar plano 2-D) */
document.getElementById("toggleParts").addEventListener("click", () => {
  partsShown = !partsShown;
  planeCanvas.style.display = partsShown ? "block" : "none";
  togglePartitions();                // avisa a AnimationMain.js
});

/* ────────── 5 · Slider de velocidad (100-1500 ms) ────────── */
const slider = document.getElementById("speedSlider");
setAnimationSpeed( 1600 - Number(slider.value) );           // inicial

slider.addEventListener("input", e => {
  const v      = Number(e.target.value);
  const speed  = 1600 - v;                                  
  setAnimationSpeed(speed);
});

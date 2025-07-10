
import { KDTree }                        from "./kd/KDTree.js";
import { setTreeRef, enqueue,
         setAnimationSpeed,
         togglePartitions }             from "./AnimationMain.js";
import { clearCanvas }                   from "./ObjectManager.js";

const tree = new KDTree();
setTreeRef( tree );

const planeCanvas = document.getElementById("plane");
let   partsShown  = false;                       // comienza oculto

const history = [];                //  pila LIFO de snapshots

function collectPoints (kdNode, out = []) {         
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

function readInputs () {
  const x = parseFloat(document.getElementById("x").value);
  const y = parseFloat(document.getElementById("y").value);
  if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
  alert("Introduce números válidos");
  return null;
}

document.getElementById("insert").addEventListener("click", async () => {
  const p = readInputs();
  if (!p) return;
  await tree.insert(p);              
  history.push( collectPoints(tree.root) );   
});


document.getElementById("delete").addEventListener("click", async () => {
  const p = readInputs();
  if (!p) return;
  await tree.delete(p);              
  history.push( collectPoints(tree.root) );   
});


document.getElementById("optimize").addEventListener("click", async () => {
  if (!tree.root) return;

  const before = collectPoints(tree.root);
  const snapshotPrev = structuredClone(before);

  const prevPoints = await tree.optimize();   

  history.push( collectPoints(tree.root) );

  history.splice(history.length-1, 0, snapshotPrev);
});


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

  partsShown = false;
  planeCanvas.style.display = "none";
});


document.getElementById("toggleParts").addEventListener("click", () => {
  partsShown = !partsShown;
  planeCanvas.style.display = partsShown ? "block" : "none";
  togglePartitions();                // avisa a AnimationMain.js
});

const slider = document.getElementById("speedSlider");
setAnimationSpeed( 1600 - Number(slider.value) );           // inicial

slider.addEventListener("input", e => {
  const v      = Number(e.target.value);
  const speed  = 1600 - v;                                  
  setAnimationSpeed(speed);
});

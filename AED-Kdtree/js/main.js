
import { KDTree }           from "./kd/KDTree.js";
import { setTreeRef, enqueue } from "./AnimationMain.js";
import { clearCanvas }      from "./ObjectManager.js";

const tree = new KDTree();
setTreeRef(tree);


function readInputs() {
  const x = parseFloat(document.getElementById("x").value);
  const y = parseFloat(document.getElementById("y").value);
  if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
  alert("Introduce números válidos");
  return null;
}


document.getElementById("insert").addEventListener("click", () => {
  const p = readInputs();
  if (p) tree.insert(p);
});


document.getElementById("delete").addEventListener("click", () => {
  const p = readInputs();
  if (p) tree.delete(p);
});


document.getElementById("reset").addEventListener("click", () => {
  tree.root = null;                
  enqueue({ action: "clearEdges" }); 
  clearCanvas();                     
  document.getElementById("x").value = "";
  document.getElementById("y").value = "";
});

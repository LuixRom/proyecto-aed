
import {
  createNode,
  moveNode,
  removeNode,
  addEdge,
  clearEdges,
  drawAll
} from "./ObjectManager.js";
import { layoutAndEnqueueMoves } from "./Layouter.js";


let treeRef = null;
export function setTreeRef(t) { treeRef = t; }


const queue = [];
export function enqueue(cmd) { queue.push(cmd); }


function handle(cmd) {
  switch (cmd.action) {
    case "createNode": createNode(cmd.node);                     break;
    case "moveNode":   moveNode(cmd.id, cmd.x, cmd.y);           break;
    case "removeNode": removeNode(cmd.id);                       break;
    case "addEdge":    addEdge(cmd.from, cmd.to);                break;
    case "clearEdges": clearEdges();                             break;
    case "reLayout":   layoutAndEnqueueMoves(treeRef.root);      break;
  }
}


const ctx = document.getElementById("board").getContext("2d");
ctx.font = "14px Segoe UI";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

function loop() {
  if (queue.length) handle(queue.shift());
  drawAll(ctx);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

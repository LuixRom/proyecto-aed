
import {
  /* nodos fijos */
  createNode, moveNode, removeNode,
  addEdge, clearEdges, drawAll,
  highlightNode, unhighlightNode,
  setVisitedNode,

  /* nodo pendiente + arista dinámica */
  createPendingNode, movePendingNode,
  attachDynamicEdge, updateDynamicEdgeTo,
  finalizePendingNode,
  setPendingHighlightAxis, clearPendingHighlight,

  /* efectos */
  flashAndRemove, flashOnly, flashOrange,

  /* aristas y utilidades */
  removeEdge, detachNode, connectIfMissing,
  discardPendingNode
} from "./ObjectManager.js";

import { layoutAndEnqueueMoves } from "./Layouter.js";
import { drawParts, resetParts, updateParts, setViewportSize } from "./PartitionManager.js";

let animationSpeed = 500;
export const setAnimationSpeed = ms => { animationSpeed = ms; };
export const getAnimationSpeed = ()  => animationSpeed;

let treeRef = null;
export const setTreeRef = t => { treeRef = t; };

const queue = [];
export const enqueue = cmd => queue.push(cmd);

const logEl = document.getElementById("log");
function appendLog(txt){
  if(!logEl) return;
  const p = document.createElement("p");
  p.textContent = txt;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;   // autoscroll
}

function handle(cmd){
  switch(cmd.action){

    case "createNode":
      createNode(cmd.node);
      updateParts(treeRef.root);                 // recalcula particiones
      break;

    case "moveNode":
      moveNode(cmd.id, cmd.x, cmd.y);
      break;

    case "removeNode":
      removeNode(cmd.id);
      updateParts(treeRef.root);                 // **NUEVO**
      break;

    case "addEdge":
      addEdge(cmd.from, cmd.to);
      break;

    case "clearEdges":
      clearEdges();                             
      break;

    case "reLayout":
      layoutAndEnqueueMoves(treeRef.root);
      updateParts(treeRef.root);                 // mantiene plano actualizado
      break;

    case "setVisitedNode":      setVisitedNode(cmd.id);               break;
    case "highlightNode":       highlightNode(cmd.id, cmd.axis);      break;
    case "unhighlightNode":     unhighlightNode(cmd.id);              break;

    case "createPendingNode":   createPendingNode(cmd.point, cmd.id); break;
    case "movePendingNode":     movePendingNode(cmd.x, cmd.y);        break;
    case "attachDynamicEdge":   attachDynamicEdge(cmd.fromId);        break;
    case "updateDynamicEdgeTo": updateDynamicEdgeTo(cmd.x, cmd.y);    break;

    case "finalizePendingNode":
      finalizePendingNode();
      updateParts(treeRef.root);                 // **NUEVO**
      break;

    case "setPendingAxis":      setPendingHighlightAxis(cmd.axis);    break;
    case "clearPendingAxis":    clearPendingHighlight();              break;

    case "log":                 appendLog(cmd.msg);                   break;

    case "flashRemove":         flashAndRemove(cmd.id);               break;
    case "flashOnly":           flashOnly(cmd.id);                    break;
    case "flashOrange":         flashOrange(cmd.id);                  break;

    case "removeEdge":          removeEdge(cmd.from, cmd.to);         break;
    case "detachNode":          detachNode(cmd.id);                   break;
    case "connectEdge":         connectIfMissing(cmd.a, cmd.b);       break;

    case "discardPendingNode":  discardPendingNode();                 break;
  }
}

const ctx = document.getElementById("board").getContext("2d");
ctx.font        = "14px Segoe UI";
ctx.textAlign   = "center";
ctx.textBaseline= "middle";

const plane  = document.getElementById("plane").getContext("2d");
setViewportSize( plane.canvas.width, plane.canvas.height );

let showParts = false;     // comienza oculto

function loop(){
  if(queue.length) handle(queue.shift());
  drawAll(ctx);            // nodos + aristas

  plane.clearRect(0,0,plane.canvas.width,plane.canvas.height);
  if (showParts) drawParts(plane);      // líneas de partición

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

export function togglePartitions(){
  showParts = !showParts;
  if (showParts){
    updateParts(treeRef.root);          // calcula las líneas la 1ª vez
  }else{
    resetParts();                       // borra las líneas al ocultar
  }
}

const tasks  = [];
let   running=false;

export async function enqueueTask(fn){
  tasks.push(fn);
  if(!running){
    running = true;
    while(tasks.length){
      await tasks.shift()();
    }
    running = false;
  }
}

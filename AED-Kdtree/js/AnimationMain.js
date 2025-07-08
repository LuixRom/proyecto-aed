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
  setPendingHighlightAxis,   // ← resalta coord. que se está comparando
  clearPendingHighlight,     // ← quita ese resaltado
  flashAndRemove,             // ← destello rojo + borrado
  flashOnly,
  flashOrange,
  removeEdge,
  detachNode,
  connectIfMissing,
  discardPendingNode
} from "./ObjectManager.js";

import { layoutAndEnqueueMoves } from "./Layouter.js";

/* ═════════════ Velocidad de animación ═════════════ */
let animationSpeed = 500;
export const setAnimationSpeed = ms => { animationSpeed = ms; };
export const getAnimationSpeed = ()  => animationSpeed;

/* ═════════════ Referencia al árbol ═════════════ */
let treeRef = null;
export const setTreeRef = t => { treeRef = t; };

/* ═════════════ Cola de comandos ═════════════ */
const queue = [];
export const enqueue = cmd => queue.push(cmd);

/* ═════════════ Panel de log ═════════════ */
const logEl = document.getElementById("log");
function appendLog(txt){
  if(!logEl) return;
  const p = document.createElement("p");
  p.textContent = txt;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;   // autoscroll
}

/* ═════════════ Despachador de comandos ═════════════ */
function handle(cmd){
  switch(cmd.action){

    /* estructura */
    case "createNode":          createNode(cmd.node);                 break;
    case "moveNode":            moveNode(cmd.id, cmd.x, cmd.y);       break;
    case "removeNode":          removeNode(cmd.id);                   break;
    case "addEdge":             addEdge(cmd.from, cmd.to);            break;
    case "clearEdges":          clearEdges();                         break;
    case "reLayout":            layoutAndEnqueueMoves(treeRef.root);  break;

    /* highlight / halo */
    case "setVisitedNode":      setVisitedNode(cmd.id);               break;
    case "highlightNode":       highlightNode(cmd.id, cmd.axis);      break;
    case "unhighlightNode":     unhighlightNode(cmd.id);              break;

    /* pendiente + arista azul */
    case "createPendingNode":   createPendingNode(cmd.point, cmd.id); break;
    case "movePendingNode":     movePendingNode(cmd.x, cmd.y);        break;
    case "attachDynamicEdge":   attachDynamicEdge(cmd.fromId);        break;
    case "updateDynamicEdgeTo": updateDynamicEdgeTo(cmd.x, cmd.y);    break;
    case "finalizePendingNode": finalizePendingNode();                break;

    /* resaltado del nodo pendiente */
    case "setPendingAxis":      setPendingHighlightAxis(cmd.axis);    break;
    case "clearPendingAxis":    clearPendingHighlight();              break;

    /* log */
    case "log":                 appendLog(cmd.msg);                   break;

    /* destello rojo + borrado diferido */
    case "flashRemove":         flashAndRemove(cmd.id);               break;
    case "flashOnly":          flashOnly(cmd.id);                    break;


    case "flashOrange":        flashOrange(cmd.id);                        break;
    case "removeEdge":         removeEdge(cmd.from, cmd.to);               break;
    case "detachNode":   detachNode(cmd.id);                       break;
    case "connectEdge":  connectIfMissing(cmd.a, cmd.b);           break;

    case "discardPendingNode": discardPendingNode();               break;
  }
}

/* ═════════════ Bucle principal de dibujo ═════════════ */
const ctx = document.getElementById("board").getContext("2d");
ctx.font = "14px Segoe UI";
ctx.textAlign   = "center";
ctx.textBaseline = "middle";

function loop(){
  if(queue.length) handle(queue.shift());
  drawAll(ctx);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);


const tasks = [];
let running = false;

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
import { enqueue } from "./AnimationMain.js";


export function layoutAndEnqueueMoves(root) {
  if (!root) return;

  const levelH = 80;   
  const nodeW  = 60;   
  const canvas = document.getElementById("board");
  const CANVAS_W = canvas.width;


  function layout(node, depth, baseX) {
    if (!node) return 0;


    const leftWidth = layout(node.left, depth + 1, baseX);


    const rightBase = baseX + leftWidth + nodeW;
    const rightWidth = layout(node.right, depth + 1, rightBase);


    node._x = baseX + leftWidth + nodeW / 2;
    node._y = depth * levelH + 40;


    return leftWidth + nodeW + rightWidth;
  }

  const totalWidth = layout(root, 0, 0);


  const shiftX = (CANVAS_W - totalWidth) / 2 + 20;   


  enqueue({ action: "clearEdges" });

  (function emit(node) {
    if (!node) return;

    enqueue({
      action: "moveNode",
      id: node.id,
      x: node._x + shiftX,
      y: node._y
    });

    if (node.left)  enqueue({ action: "addEdge", from: node.id, to: node.left.id });
    if (node.right) enqueue({ action: "addEdge", from: node.id, to: node.right.id });

    emit(node.left); emit(node.right);
  })(root);
}

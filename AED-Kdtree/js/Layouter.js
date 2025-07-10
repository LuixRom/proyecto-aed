import { enqueue } from "./AnimationMain.js";

export function layoutAndEnqueueMoves(root) {
  if (!root) return;

  const nodeW   = 60;   
  const levelH  = 80;   

  const canvas  = document.getElementById("board");
  const CANVAS_W = canvas.width;
  const CANVAS_H = canvas.height;
  const MARGIN   = 20;  


  function layout(node, depth, baseX) {
    if (!node) return { width:0, maxDepth:depth-1 };

    const l = layout(node.left , depth+1, baseX);
    const r = layout(node.right, depth+1, baseX + l.width + nodeW);

    node._x = baseX + l.width + nodeW/2;
    node._y = depth * levelH + MARGIN + nodeW/2;   

    return {
      width:     l.width + nodeW + r.width,
      maxDepth:  Math.max(l.maxDepth, r.maxDepth)
    };
  }

  const { width:totalW, maxDepth } = layout(root, 0, 0);

  const neededH = (maxDepth+1)*levelH + MARGIN*2;
  const scaleX  = (CANVAS_W - MARGIN*2) / totalW;
  const scaleY  = (CANVAS_H - MARGIN*2) / neededH;
  const scale   = Math.min(1, scaleX, scaleY);   // ≤1  (solo reducimos)

  const shiftX = (CANVAS_W - totalW*scale)/2;

  enqueue({ action:"clearEdges" });

  (function emit(node){
    if(!node) return;

    const finalX = shiftX + node._x * scale;
    const finalY = MARGIN + (node._y - MARGIN) * scale; // mantiene margen

    node._finalX = finalX;
    node._finalY = finalY;

    enqueue({ action:"moveNode", id:node.id, x:finalX, y:finalY });

    if(node.left)  enqueue({ action:"addEdge", from:node.id, to:node.left.id });
    if(node.right) enqueue({ action:"addEdge", from:node.id, to:node.right.id });

    emit(node.left); emit(node.right);
  })(root);
}

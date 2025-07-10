export const nodes = new Map();   
let edges          = [];         
let pendingNode    = null;        // nodo azul que entra
let dynamicEdge    = null;        // arista azul durante la inserción
let visitedNodeId  = null;        // id con halo azul

export function createNode(n){
  nodes.set(n.id,{
    x:0, y:0, r:18,
    text: `(${n.point})`,
    color:"#4CAF50",
    highlightAxis:null          // 0,1 o null
  });
}

export function discardPendingNode(){
  pendingNode = null;
  dynamicEdge = null;
}

export function moveNode(id,x,y){
  const o = nodes.get(id);
  if(o){ o.x = x; o.y = y; }
}

export function removeNode(id){
  nodes.delete(id);
  edges = edges.filter(e => e.from !== id && e.to !== id);
}
export const addEdge   = (f,t) => edges.push({from:f,to:t});
export const clearEdges= ()    => { edges = []; };

export function clearCanvas(){
  nodes.clear();
  edges = [];
  pendingNode   = null;
  dynamicEdge   = null;
  visitedNodeId = null;
}

export const setVisitedNode   = id => { visitedNodeId = id; };
export const highlightNode    = (id,a) => { const n=nodes.get(id); if(n) n.highlightAxis=a; };
export const unhighlightNode  = id => { const n=nodes.get(id); if(n) n.highlightAxis=null; };
export const updateNodeText   = (id,t) => { const n=nodes.get(id); if(n) n.text = t; };

function pushColor(id, newColor){
  const n = nodes.get(id); if (!n) return;
  if (!n.colorStack) n.colorStack = [];
  n.colorStack.push(n.color);
  n.color = newColor;
}
function popColor(id){
  const n = nodes.get(id); if (!n || !n.colorStack?.length) return;
  n.color = n.colorStack.pop();
}


export function flashOrange(id, ms = 350){
  pushColor(id, "#FF9800");
  setTimeout(() => {
    popColor(id);
    const n = nodes.get(id);
    if (n) n.highlightAxis = null;     
  }, ms);
}

export function flashOnly(id, ms = 300){
  pushColor(id, "#E53935");
  setTimeout(() => {
    popColor(id);
    const n = nodes.get(id);
    if (n) n.highlightAxis = null;     
  }, ms);
}

export function flashAndRemove(id, ms = 300){
  pushColor(id, "#E53935");               // rojo
  setTimeout(() => {
    nodes.delete(id);
    edges = edges.filter(e => e.from !== id && e.to !== id);
  }, ms);
}

export const removeEdge = (from, to) => {
  edges = edges.filter(e => !(e.from === from && e.to === to));
};

export const detachNode = id => {
  edges = edges.filter(e => e.from !== id && e.to !== id);
};

export const connectIfMissing = (from, to) => {
  if (!edges.some(e => e.from === from && e.to === to))
    edges.push({from,to});
};


export const setPendingHighlightAxis = ax =>{
  if(pendingNode) pendingNode.highlightAxis = ax;
};
export const clearPendingHighlight = () =>{
  if(pendingNode) pendingNode.highlightAxis = null;
};

export function createPendingNode(p,id){
  pendingNode = {
    id,
    x:50, y:250, r:18,
    color:"#00BCD4",
    text:`(${p})`,
    highlightAxis:null
  };
}
export function movePendingNode(x,y){
  if(pendingNode){ pendingNode.x = x; pendingNode.y = y; }
}
export function attachDynamicEdge(fromId){
  const sx = pendingNode ? pendingNode.x : 0,
        sy = pendingNode ? pendingNode.y : 0;
  dynamicEdge = { fromId, toX:sx, toY:sy };
}
export const updateDynamicEdgeTo = (x,y) =>{
  if(dynamicEdge){ dynamicEdge.toX = x; dynamicEdge.toY = y; }
};
export function finalizePendingNode(){
  if(pendingNode){
    nodes.set(pendingNode.id,{
      x: pendingNode.x,
      y: pendingNode.y,
      r: 18,
      color:"#4CAF50",
      text: pendingNode.text,
      highlightAxis:null
    });
    if(dynamicEdge) edges.push({from:dynamicEdge.fromId,to:pendingNode.id});
  }
  pendingNode = null;
  dynamicEdge = null;
}
export function setFinalPosition(id,x,y){
  const n = nodes.get(id);
  if(n){ n._finalX = x; n._finalY = y; }
}

function drawCoordinate(ctx, x, y, fullText, axis){
  if(axis === null){
    ctx.fillStyle="#fff";
    ctx.fillText(fullText, x, y);
    return;
  }
  const parts  = fullText.slice(1,-1).split(",");
  const before = axis===0 ? "("          : `(${parts[0]},`;
  const mid    = axis===0 ? parts[0]     : parts[1];
  const after  = axis===0 ? `,${parts[1]})` : ")";

  const wBefore = ctx.measureText(before).width;
  const wMid    = ctx.measureText(mid).width;
  const wAfter  = ctx.measureText(after).width;
  const totalW  = wBefore + wMid + wAfter;
  const xLeft   = x - totalW/2;

  ctx.fillStyle="#fff";
  ctx.fillText(before, xLeft + wBefore/2,           y);
  ctx.fillText(after ,  xLeft + wBefore + wMid + wAfter/2, y);

  ctx.save();
  ctx.font   = "bold 14px Segoe UI";
  ctx.fillStyle = "#000";
  ctx.fillText(mid, xLeft + wBefore + wMid/2, y);
  ctx.restore();
}

export function drawAll(ctx){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);

  ctx.strokeStyle="#4CAF50";
  ctx.lineWidth = 2;
  edges.forEach(e=>{
    const a = nodes.get(e.from), b = nodes.get(e.to);
    if(!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + a.r);
    ctx.lineTo(b.x, b.y - b.r);
    ctx.stroke();
  });

  nodes.forEach(o=>{
    ctx.fillStyle   = o.color;
    ctx.strokeStyle = o.color;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    drawCoordinate(ctx, o.x, o.y, o.text, o.highlightAxis);
  });

  if(visitedNodeId !== null){
    const n = nodes.get(visitedNodeId);
    if(n){
      ctx.beginPath();
      ctx.strokeStyle="#00BCD4";
      ctx.lineWidth = 3;
      ctx.arc(n.x, n.y, n.r + 8, 0, Math.PI*2);
      ctx.stroke();
    }
  }

  if(dynamicEdge){
    const f = nodes.get(dynamicEdge.fromId);
    if(f){
      ctx.strokeStyle="#00BCD4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y + f.r);
      ctx.lineTo(dynamicEdge.toX, dynamicEdge.toY - 18);
      ctx.stroke();
    }
  }

  if(pendingNode){
    ctx.fillStyle   = pendingNode.color;
    ctx.strokeStyle = pendingNode.color;
    ctx.beginPath();
    ctx.arc(pendingNode.x, pendingNode.y, pendingNode.r, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    drawCoordinate(ctx, pendingNode.x, pendingNode.y,
                   pendingNode.text, pendingNode.highlightAxis);
  }
}






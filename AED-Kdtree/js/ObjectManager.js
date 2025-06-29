
export const nodes = new Map();              
export function createNode(n) {
  nodes.set(n.id, { x: 0, y: 0, r: 18, text: `(${n.point})` });
}

export function moveNode(id, x, y) {
  const o = nodes.get(id);
  if (o) { o.x = x; o.y = y; }
}

export function removeNode(id) {
  nodes.delete(id);
  edges = edges.filter(e => e.from !== id && e.to !== id);
}

let edges = [];
export function addEdge(from, to) { edges.push({ from, to }); }
export function clearEdges()      { edges = []; }


export function clearCanvas() {
  nodes.clear();   
}

export function drawAll(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);


  ctx.strokeStyle = "#4CAF50";
  ctx.lineWidth   = 2;
  edges.forEach(e => {
    const a = nodes.get(e.from), b = nodes.get(e.to);
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + a.r);
    ctx.lineTo(b.x, b.y - b.r);
    ctx.stroke();
  });

  ctx.fillStyle   = "#4CAF50";
  ctx.strokeStyle = "#4CAF50";
  nodes.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.fillText(o.text, o.x, o.y);
    ctx.fillStyle = "#4CAF50";
  });
}


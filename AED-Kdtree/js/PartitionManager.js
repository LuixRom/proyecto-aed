/* PartitionManager.js  –  ahora dibuja ejes + puntos + coordenadas */
const PADDING = 20;
let W = 800, H = 500;

let bbox;                       // {xmin,xmax,ymin,ymax}
let segments   = [];            // líneas de partición
let pixPoints  = [];            // [{x,y,label}, …]   << NUEVO ***

/* ═════════ API ═════════ */
export function setViewportSize(w, h){ W = w; H = h; }

export function resetParts(){
  segments.length  = 0;
  pixPoints.length = 0;         //  << NUEVO
  bbox = null;
}

export function updateParts(root){
  resetParts();
  if(!root) return;

  /* 1‧ bounding-box global */
  bbox = { xmin:+Infinity, xmax:-Infinity, ymin:+Infinity, ymax:-Infinity };
  (function walk(n){
    if(!n) return;
    const [x,y] = n.point;
    bbox.xmin = Math.min(bbox.xmin, x);
    bbox.xmax = Math.max(bbox.xmax, x);
    bbox.ymin = Math.min(bbox.ymin, y);
    bbox.ymax = Math.max(bbox.ymax, y);
    walk(n.left); walk(n.right);
  })(root);

  if(bbox.xmin === bbox.xmax){ bbox.xmin--; bbox.xmax++; }
  if(bbox.ymin === bbox.ymax){ bbox.ymin--; bbox.ymax++; }

  /* 2‧ segmentos + puntos (ambos ya escalados) */
  buildSegments(root, {...bbox});           // particiones
  buildPixPoints(root);                     //  << NUEVO
}

/* ═════════ Dibujo principal ═════════ */
export function drawParts(ctx){
  if(!bbox) return;

  ctx.save();
  ctx.clearRect(0,0,W,H);

  /* 0. ejes (gris claro) */
  ctx.strokeStyle = "#6667";
  ctx.lineWidth   = 1;
  ctx.setLineDash([]);
  const zeroX = sx(0), zeroY = sy(0);
  ctx.beginPath();
  ctx.moveTo(zeroX, PADDING); ctx.lineTo(zeroX, H-PADDING);   // eje Y
  ctx.moveTo(PADDING, zeroY); ctx.lineTo(W-PADDING, zeroY);   // eje X
  ctx.stroke();

  /* 1. líneas de partición (rojo punteado) */
  ctx.setLineDash([6,4]);
  ctx.strokeStyle="#e53935";
  ctx.lineWidth   = 1.5;
  segments.forEach(s=>{
    ctx.beginPath();
    ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
  });

  /* 2. puntos + etiquetas */
  ctx.setLineDash([]);
  ctx.fillStyle="#4CAF50";
  ctx.strokeStyle="#4CAF50";
  pixPoints.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
    ctx.fillText(p.label, p.x+6, p.y-6);
  });
  ctx.restore();
}

/* ═════════ Helpers internas ═════════ */
function sx(x){ return PADDING+(x-bbox.xmin)/(bbox.xmax-bbox.xmin)*(W-2*PADDING); }
function sy(y){ return H-PADDING-(y-bbox.ymin)/(bbox.ymax-bbox.ymin)*(H-2*PADDING); }

function buildPixPoints(n){
  if(!n) return;
  pixPoints.push({ x:sx(n.point[0]), y:sy(n.point[1]),
                   label:`(${n.point[0]},${n.point[1]})` });
  buildPixPoints(n.left); buildPixPoints(n.right);
}

function buildSegments(n,R){
  if(!n) return;
  const axis = n.depth & 1;
  if(axis===0){           // vertical
    const X = sx(n.point[0]);
    segments.push({ x1:X,y1:sy(R.ymin), x2:X,y2:sy(R.ymax) });
    buildSegments(n.left ,{ xmin:R.xmin, xmax:n.point[0],
                             ymin:R.ymin, ymax:R.ymax });
    buildSegments(n.right,{ xmin:n.point[0], xmax:R.xmax,
                             ymin:R.ymin, ymax:R.ymax });
  }else{                  // horizontal
    const Y = sy(n.point[1]);
    segments.push({ x1:sx(R.xmin), y1:Y, x2:sx(R.xmax), y2:Y });
    buildSegments(n.left ,{ xmin:R.xmin, xmax:R.xmax,
                             ymin:R.ymin, ymax:n.point[1] });
    buildSegments(n.right,{ xmin:R.xmin, xmax:R.xmax,
                             ymin:n.point[1], ymax:R.ymax });
  }
}

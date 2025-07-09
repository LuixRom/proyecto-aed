/* PartitionManager.js
 * --------------------------------------------------------
 *  • Construye las líneas de partición (k-d tree 2-D)
 *  • Las guarda ya escaladas a pixels para el canvas “plane”
 * -------------------------------------------------------- */

const PADDING = 20;          // margen interno
let   W = 800, H = 500;      // tamaño del canvas (se ajusta en setViewport)
let   bbox;                  // {xmin,xmax,ymin,ymax}

let segments = [];           // [{x1,y1,x2,y2}, …]  en coordenadas PIXEL

/* ============  API  ============ */
export function setViewportSize(w,h){
  W=w; H=h;
}

export function resetParts(){
  segments.length = 0;
  bbox = null;
}

export function updateParts(root){
  resetParts();
  if(!root) return;
  /* 1 · bounding-box de todos los puntos ----------------------------- */
  bbox = { xmin:+Infinity, xmax:-Infinity, ymin:+Infinity, ymax:-Infinity };
  (function walk(n){
    if(!n) return;
    const [x,y] = n.point;
    if(x<bbox.xmin) bbox.xmin=x;
    if(x>bbox.xmax) bbox.xmax=x;
    if(y<bbox.ymin) bbox.ymin=y;
    if(y>bbox.ymax) bbox.ymax=y;
    walk(n.left); walk(n.right);
  })(root);

  /* evita división por 0 */
  if(bbox.xmin===bbox.xmax){ bbox.xmin-=1; bbox.xmax+=1; }
  if(bbox.ymin===bbox.ymax){ bbox.ymin-=1; bbox.ymax+=1; }

  /* 2 · construye segmentos escalados ------------------------------- */
  buildSegments(root, {...bbox});
}

export function drawParts(ctx){
  if(!segments.length) return;

  ctx.save();
  ctx.setLineDash([6,4]);
  ctx.lineWidth   = 1.5;
  ctx.strokeStyle = "#ff5555";

  segments.forEach(s=>{
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  });
  ctx.restore();
}

/* ============ helpers ============ */
function sx(x){          // data → pixel
  return PADDING + (x-bbox.xmin)/(bbox.xmax-bbox.xmin) * (W-2*PADDING);
}
function sy(y){
  return H-PADDING - (y-bbox.ymin)/(bbox.ymax-bbox.ymin) * (H-2*PADDING);
}

function buildSegments(n, R){
  if(!n) return;
  const axis = n.depth & 1;            // 0=x  1=y

  if(axis===0){  /* vertical */
    const X = sx(n.point[0]);
    segments.push({ x1:X, y1:sy(R.ymin), x2:X, y2:sy(R.ymax) });

    buildSegments(n.left ,
      { xmin:R.xmin, xmax:n.point[0], ymin:R.ymin, ymax:R.ymax });
    buildSegments(n.right,
      { xmin:n.point[0], xmax:R.xmax, ymin:R.ymin, ymax:R.ymax });

  }else{         /* horizontal */
    const Y = sy(n.point[1]);
    segments.push({ x1:sx(R.xmin), y1:Y, x2:sx(R.xmax), y2:Y });

    buildSegments(n.left ,
      { xmin:R.xmin, xmax:R.xmax, ymin:R.ymin, ymax:n.point[1] });
    buildSegments(n.right,
      { xmin:R.xmin, xmax:R.xmax, ymin:n.point[1], ymax:R.ymax });
  }
}

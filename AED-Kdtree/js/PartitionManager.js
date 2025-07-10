const PADDING  = 20;       // margen interno para escalar
const EXTRA    = 36;       // alargue fijo
const BBOX_PAD = 0.03;     // 3 % de margen lógico

let W = 800, H = 500;
let bbox, segments = [], pixPoints = [];

export function setViewportSize(w, h){ W = w; H = h; }
export function resetParts(){ segments.length = 0; pixPoints.length = 0; bbox = null; }

export function updateParts(root){
  resetParts(); if (!root) return;

  bbox = { xmin:+1e9, xmax:-1e9, ymin:+1e9, ymax:-1e9 };
  (function walk(n){
    if(!n) return;
    const [x, y] = n.point;
    bbox.xmin = Math.min(bbox.xmin, x);
    bbox.xmax = Math.max(bbox.xmax, x);
    bbox.ymin = Math.min(bbox.ymin, y);
    bbox.ymax = Math.max(bbox.ymax, y);
    walk(n.left); walk(n.right);
  })(root);

  const dx = (bbox.xmax - bbox.xmin) || 1;
  const dy = (bbox.ymax - bbox.ymin) || 1;
  bbox.xmin -= dx * BBOX_PAD;  bbox.xmax += dx * BBOX_PAD;
  bbox.ymin -= dy * BBOX_PAD;  bbox.ymax += dy * BBOX_PAD;

  buildSegments(root, { ...bbox }, 0);
  buildPixPoints(root);
}

export function drawParts(ctx){
  if (!bbox) return;
  ctx.save(); ctx.clearRect(0, 0, W, H);

  ctx.setLineDash([]); ctx.strokeStyle = "#6667"; ctx.lineWidth = 1;
  const zx = sx(0), zy = sy(0);
  ctx.beginPath();
  ctx.moveTo(zx, PADDING);   ctx.lineTo(zx, H - PADDING);
  ctx.moveTo(PADDING, zy);   ctx.lineTo(W - PADDING, zy); ctx.stroke();

  ctx.setLineDash([6, 4]); ctx.strokeStyle = "#e53935"; ctx.lineWidth = 1.5;
  segments.forEach(s=>{
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
  });

  ctx.setLineDash([]); ctx.fillStyle = "#4CAF50";
  pixPoints.forEach(p=>{
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillText(p.label, p.x + 8, p.y - 8);
  });

  ctx.restore();
}

function sx(x){ return PADDING + (x - bbox.xmin) / (bbox.xmax - bbox.xmin) * (W - 2*PADDING); }
function sy(y){ return H - PADDING - (y - bbox.ymin) / (bbox.ymax - bbox.ymin) * (H - 2*PADDING); }
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function buildPixPoints(n){
  if(!n) return;
  pixPoints.push({ x: sx(n.point[0]), y: sy(n.point[1]), label: `(${n.point})` });
  buildPixPoints(n.left); buildPixPoints(n.right);
}

function crossesHoriz(x, y0, y1){
  return segments.some(s=>{
    if(s.y1 !== s.y2) return false;             // no horizontal
    const a = Math.min(s.x1, s.x2), b = Math.max(s.x1, s.x2);
    return x >= a - 1 && x <= b + 1 && ((y0 <= s.y1 && s.y1 <= y1) || (y1 <= s.y1 && s.y1 <= y0));
  });
}
function crossesVert(y, x0, x1){
  return segments.some(s=>{
    if(s.x1 !== s.x2) return false;             // no vertical
    const a = Math.min(s.y1, s.y2), b = Math.max(s.y1, s.y2);
    return y >= a - 1 && y <= b + 1 && ((x0 <= s.x1 && s.x1 <= x1) || (x1 <= s.x1 && s.x1 <= x0));
  });
}

function buildSegments(n, R, depth){
  if(!n) return;
  const axis = depth & 1;             

  if(axis === 0){                     
    const X = sx(n.point[0]);
    let yTop = sy(R.ymax), yBot = sy(R.ymin);

    if(depth === 0){
      yTop = 0;
      yBot = H;
    }else{
      if(R.ymax === bbox.ymax){
        const tryTop = clamp(yTop - EXTRA, 0, H);
        if(!crossesHoriz(X, tryTop, yTop)) yTop = tryTop;
      }
      if(R.ymin === bbox.ymin){
        const tryBot = clamp(yBot + EXTRA, 0, H);
        if(!crossesHoriz(X, yBot, tryBot)) yBot = tryBot;
      }
    }

    segments.push({ x1: X, y1: yTop, x2: X, y2: yBot });

    buildSegments(n.left , { xmin: R.xmin, xmax: n.point[0], ymin: R.ymin, ymax: R.ymax }, depth + 1);
    buildSegments(n.right, { xmin: n.point[0], xmax: R.xmax, ymin: R.ymin, ymax: R.ymax }, depth + 1);

  }else{                                
    const Y = sy(n.point[1]);
    let xL = sx(R.xmin), xR = sx(R.xmax);

    if(R.xmin === bbox.xmin){
      const tryL = clamp(xL - EXTRA, 0, W);
      if(!crossesVert(Y, tryL, xL)) xL = tryL;
    }
    if(R.xmax === bbox.xmax){
      const tryR = clamp(xR + EXTRA, 0, W);
      if(!crossesVert(Y, xR, tryR)) xR = tryR;
    }

    segments.push({ x1: xL, y1: Y, x2: xR, y2: Y });

    buildSegments(n.left , { xmin: R.xmin, xmax: R.xmax, ymin: R.ymin,     ymax: n.point[1] }, depth + 1);
    buildSegments(n.right, { xmin: R.xmin, xmax: R.xmax, ymin: n.point[1], ymax: R.ymax }, depth + 1);
  }
}

const nodes = new Map();
let   lines = [];


const SCALE   = 25;     
const MIN     = -10;
const MAX     =  10;
const OFFSETX = 50;       
const OFFSETY = 50;    
const WPIX    = (MAX - MIN) * SCALE;   


export function clearAll() { nodes.clear(); lines = []; }
export function addNode(id, x, y)           { nodes.set(id, { x, y }); }
export function addLine(x1, y1, x2, y2)     { lines.push({ x1, y1, x2, y2 }); }


export function draw(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);


  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle   = '#ffffff';
  ctx.lineWidth   = 2;
  ctx.setLineDash([]);


  ctx.beginPath();
  ctx.moveTo(OFFSETX, OFFSETY);
  ctx.lineTo(OFFSETX, OFFSETY + WPIX);
  ctx.stroke();


  ctx.beginPath();
  ctx.moveTo(OFFSETX, OFFSETY + WPIX);
  ctx.lineTo(OFFSETX + WPIX, OFFSETY + WPIX);
  ctx.stroke();


  ctx.font = '12px monospace';


  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let x = MIN; x <= MAX; x += 5) {
    const px = OFFSETX + (x - MIN) * SCALE;
    ctx.beginPath();
    ctx.moveTo(px, OFFSETY + WPIX - 5);
    ctx.lineTo(px, OFFSETY + WPIX + 5);
    ctx.stroke();
    ctx.fillText(x.toString(), px, OFFSETY + WPIX + 8);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = MIN; y <= MAX; y += 5) {
    const py = OFFSETY + (MAX - y) * SCALE;
    ctx.beginPath();
    ctx.moveTo(OFFSETX - 5, py);
    ctx.lineTo(OFFSETX + 5, py);
    ctx.stroke();
    ctx.fillText(y.toString(), OFFSETX - 8, py);
  }
  ctx.restore();

  ctx.strokeStyle = '#777';
  ctx.setLineDash([4, 4]);
  lines.forEach(l => {
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  ctx.fillStyle = '#ff4040';
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}
const SCALE   = 25;   
const OFFSETX = 50;   
const OFFSETY = 50;   
const MIN     = -10;
const MAX     =  10;


export function dataToPixel([x, y]) {
  const px = OFFSETX + (x - MIN) * SCALE;
  const py = OFFSETY + (MAX - y) * SCALE;   
  return [px, py];
}


export function layout(root, obj) {

  const full = {
    xMin: OFFSETX,
    xMax: OFFSETX + (MAX - MIN) * SCALE,
    yMin: OFFSETY,
    yMax: OFFSETY + (MAX - MIN) * SCALE
  };

  const rec = (node, bounds) => {
    if (!node) return;
    const axis  = node.depth % 2;          
    const [px, py] = dataToPixel(node.point);
    obj.addNode(node.id, px, py);


    if (axis === 0) {                    
      obj.addLine(px, bounds.yMin, px, bounds.yMax);
    } else {                               
      obj.addLine(bounds.xMin, py, bounds.xMax, py);
    }

    if (node.left) {
      const b = { ...bounds };
      if (axis === 0) b.xMax = px; else b.yMax = py;
      rec(node.left, b);
    }
    if (node.right) {
      const b = { ...bounds };
      if (axis === 0) b.xMin = px; else b.yMin = py;
      rec(node.right, b);
    }
  };

  rec(root, full);
}

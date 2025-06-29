import KDTree                from './kd/KDTree.js';
import { clearAll, addNode, addLine, draw } from './ObjectManager.js';
import { layout }            from './Layouter.js';

const tree = new KDTree();
const canvas = document.getElementById('board');
const ctx    = canvas.getContext('2d');

const read = () => [
  parseFloat(document.getElementById('x').value),
  parseFloat(document.getElementById('y').value)
];
const redraw = () => {
  clearAll();
  layout(tree.root, { addNode, addLine });
  draw(ctx);
};

document.getElementById('insert').onclick = () => {
  const p = read();
  if (p.every(Number.isFinite)) { tree.insert(p); redraw(); }
  else alert('Introduce números válidos');
};

document.getElementById('reset').onclick = () => {
  tree.reset(); clearAll(); draw(ctx);
  document.querySelectorAll('#controls input').forEach(i => i.value = '');
};

draw(ctx);

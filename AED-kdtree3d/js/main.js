import KDTree             from './kd/KDTree.js';
import { SceneManager }   from './SceneManager.js';
import Visualizer3D       from './Visualizer3D.js';

const canvas = document.getElementById('webgl');
const sm  = new SceneManager(canvas);
const vis = new Visualizer3D(sm);
const kdt = new KDTree();

const readInputs = () => {
  const x = parseFloat(document.getElementById('x').value);
  const y = parseFloat(document.getElementById('y').value);
  const z = parseFloat(document.getElementById('z').value);
  return [x, y, z].every(Number.isFinite) ? [x, y, z] : null;
};
const redraw = () => { vis.reset(); vis.renderKD(kdt.root); sm.render(); };

document.getElementById('insert').onclick = () => {
  const p = readInputs();
  if (p) { kdt.insert(p); redraw(); }
};
document.getElementById('reset').onclick = () => {
  kdt.reset(); vis.reset();
  document.querySelectorAll('#controls input').forEach(i => i.value = '');
  sm.render();
};

const animate = () => { requestAnimationFrame(animate); sm.render(); };
animate();

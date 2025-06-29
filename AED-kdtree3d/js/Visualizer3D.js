import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

const COLORS  = [0xff5555, 0x55ff55, 0x5588ff];  
const OPACITY = 0.25;

export default class Visualizer3D {
  constructor(sceneMgr) {
    this.sm   = sceneMgr;          
    this.objs = [];
  }

  reset() { this.objs.forEach(o => this.sm.scene.remove(o)); this.objs.length = 0; }

  _add(o) { this.sm.scene.add(o); this.objs.push(o); }

  addPoint([x, y, z]) {
    const g = new THREE.SphereGeometry(0.25, 16, 16);
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const s = new THREE.Mesh(g, m);
    s.position.set(x, y, z);
    this._add(s);
  }

  addPlane(axis, coord, bounds) {
    const [min, max] = bounds;
    const sizeA = max[(axis + 1) % 3] - min[(axis + 1) % 3];
    const sizeB = max[(axis + 2) % 3] - min[(axis + 2) % 3];

    const g  = new THREE.PlaneGeometry(sizeA, sizeB);
    const m  = new THREE.MeshBasicMaterial({
      color: COLORS[axis], side: THREE.DoubleSide,
      transparent: true, opacity: OPACITY,
    });
    const p  = new THREE.Mesh(g, m);

    if (axis === 0) {                 
      p.rotation.y = Math.PI / 2;
      p.position.set(coord, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    } else if (axis === 1) {          
      p.rotation.x = -Math.PI / 2;
      p.position.set((min[0] + max[0]) / 2, coord, (min[2] + max[2]) / 2);
    } else {                          
      p.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, coord);
    }
    this._add(p);
  }

  renderKD(node, bounds = [[0, 0, 0], [10, 10, 10]]) {
    if (!node) return;
    const axis  = node.depth % 3;
    const coord = node.point[axis];

    this.addPlane(axis, coord, bounds);
    this.addPoint(node.point);

    const left  = [bounds[0].slice(), bounds[1].slice()];
    const right = [bounds[0].slice(), bounds[1].slice()];
    left[1][axis]  = coord;
    right[0][axis] = coord;

    this.renderKD(node.left,  left);
    this.renderKD(node.right, right);
  }
}

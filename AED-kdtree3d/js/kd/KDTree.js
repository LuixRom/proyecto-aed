import KDNode from './KDNode.js';

export default class KDTree {
  constructor() { this.root = null; }

  insert(point) { this.root = this._insert(this.root, point, 0); }

  _insert(node, point, depth) {
    if (!node) return new KDNode(point, depth);

    const axis = depth % 3;
    if (point[axis] < node.point[axis])
      node.left  = this._insert(node.left,  point, depth + 1);
    else
      node.right = this._insert(node.right, point, depth + 1);
    return node;
  }

  reset() { this.root = null; }
}

export default class KDNode {
  constructor(point, depth = 0) {
    this.point = point;
    this.left = null;
    this.right = null;
    this.depth = depth;
    this.id = KDNode._nextId++;
    this.parentId = null; 
  }
}
KDNode._nextId = 0;

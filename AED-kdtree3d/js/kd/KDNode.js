export default class KDNode {
  constructor(point, depth = 0) {
    this.point = point;
    this.depth = depth;
    this.left  = null;
    this.right = null;
  }
}

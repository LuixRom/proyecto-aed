import { enqueue } from "../AnimationMain.js";
import KDNode from "./KDNode.js";

export class KDTree {
  constructor() { this.root = null; }


  insert(point) {
    this.root = this._insert(this.root, point, 0);
    enqueue({ action: "reLayout" });
  }

  _insert(node, point, depth) {
    if (!node) {
      const n = new KDNode(point, depth);
      enqueue({ action: "createNode", node: n });
      return n;
    }
    const axis = depth % 2;
    if (point[axis] < node.point[axis])
      node.left  = this._insert(node.left,  point, depth + 1);
    else
      node.right = this._insert(node.right, point, depth + 1);
    return node;
  }


  delete(point) {
    this.root = this._delete(this.root, point, 0);
    enqueue({ action: "reLayout" });
  }

  _delete(node, point, depth) {
    if (!node) return null;

    const axis = depth % 2;


    if (point[0] === node.point[0] && point[1] === node.point[1]) {

      if (!node.left && !node.right) {
        enqueue({ action: "removeNode", id: node.id });
        return null;
      }

      if (node.right) {
        const min = this._findMin(node.right, axis, depth + 1);
        node.point = min.point;
        node.right = this._delete(node.right, min.point, depth + 1);
      } else {
        const min = this._findMin(node.left, axis, depth + 1);
        node.point = min.point;
        node.left  = this._delete(node.left,  min.point, depth + 1);
      }
      return node;
    }


    if (point[axis] < node.point[axis])
      node.left  = this._delete(node.left,  point, depth + 1);
    else
      node.right = this._delete(node.right, point, depth + 1);
    return node;
  }

  _findMin(node, axis, depth) {
    if (!node) return null;
    const curAxis = depth % 2;
    if (curAxis === axis) {
      return node.left ? this._findMin(node.left, axis, depth + 1) : node;
    }
    const leftMin  = this._findMin(node.left,  axis, depth + 1);
    const rightMin = this._findMin(node.right, axis, depth + 1);
    let min = node;
    if (leftMin  && leftMin.point[axis]  < min.point[axis]) min = leftMin;
    if (rightMin && rightMin.point[axis] < min.point[axis]) min = rightMin;
    return min;
  }
}

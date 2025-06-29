import KDNode from './KDNode.js';

export default class KDTree{
  constructor(){this.root=null;}

  insert(p){this.root=this._insert(this.root,p,0);}
  _insert(node,p,depth){
    if(!node) return new KDNode(p,depth);
    const axis=depth%2;                     
    if(p[axis]<node.point[axis])
      node.left =this._insert(node.left ,p,depth+1);
    else
      node.right=this._insert(node.right,p,depth+1);
    return node;
  }

  reset(){this.root=null;}
}

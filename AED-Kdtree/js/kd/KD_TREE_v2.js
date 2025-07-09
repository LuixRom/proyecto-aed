
import { enqueue, getAnimationSpeed } from "../AnimationMain.js";
import { enqueueTask }                     from "../AnimationMain.js";
import {

  nodes,
  flashOnly,        // destello rojo     (NO borra)
  flashOrange,      // destello naranja  (candidato)
  flashAndRemove,   // destello rojo + borrar
  detachNode,       // quita TODAS las aristas que tocan un id
  connectIfMissing,  // crea arista (si aún no existe)
  removeEdge
} from "../ObjectManager.js";

import KDNode from "./KDNode.js";

export class KDTree {
  constructor(){ this.root = null; }




async insert(pt){

  if (!Array.isArray(pt) || pt.length !== 2){
    enqueue({action:"log", msg:"• Formato de punto incorrecto"}); return;
  }
  const P = pt.map(Number);


  if (this._existeSuperKey(this.root, P)){
    enqueue({action:"log", msg:"• Punto duplicado — inserción ignorada"});
    enqueue({action:"discardPendingNode"});
    return;
  }


  const pendingId = KDNode._nextId;
  enqueue({action:"log", msg:"────────────"});
  enqueue({action:"log", msg:`Insertando punto (${P})`});
  enqueue({action:"createPendingNode", point:P, id:pendingId});


  this.root = await this._insert(this.root, P, 0, null);
  enqueue({action:"reLayout"});


  let n=null;
  for(let i=0;i<50;i++){
    n = this._findById(this.root, pendingId);
    if(n && n._finalX !== undefined) break;
    await new Promise(r=>setTimeout(r,20));
  }
  const { _finalX:fx, _finalY:fy } = n;
  if(n.parentId!==null) enqueue({action:"attachDynamicEdge", fromId:n.parentId});

  const S=20;
  for(let i=0;i<=S;i++){
    const t=i/S, x=50+(fx-50)*t, y=250+(fy-250)*t;
    enqueue({action:"movePendingNode", x, y});
    if(n.parentId!==null) enqueue({action:"updateDynamicEdgeTo", x, y});
    await new Promise(r=>setTimeout(r,getAnimationSpeed()/S));
  }
  enqueue({action:"finalizePendingNode"});
  setTimeout(()=>enqueue({action:"reLayout"}),200);
}


async _insert(node, pt, depth, parentId){
  if(!node){
    enqueue({action:"log", msg:`  └─ Subárbol vacío → se crea nodo (${pt})`});
    const n = new KDNode(pt, depth); n.parentId = parentId; return n;
  }


  const j   = depth & 1;                       // eje discriminante
  const cmp = this._cmpSuperKey(pt, node.point, j);


  enqueue({action:"setVisitedNode", id:node.id});
  enqueue({action:"highlightNode" , id:node.id, axis:j});
  enqueue({action:"setPendingAxis", axis:j});
  enqueue({action:"log",
           msg:`  • Comparando eje ${j?'y':'x'}: ${pt[j]} con ${node.point[j]}`});
  await new Promise(r=>setTimeout(r,getAnimationSpeed()));
  enqueue({action:"unhighlightNode", id:node.id});
  enqueue({action:"setVisitedNode",  id:null});
  enqueue({action:"clearPendingAxis"});


  if (cmp === 0){                               // duplicado exacto
    enqueue({action:"log", msg:"• Punto duplicado — inserción ignorada"});
    enqueue({action:"discardPendingNode"});
    return node;
  }
  if (cmp < 0){
    enqueue({action:"log", msg:"    ↳ SUCCESSOR = LOSON → IZQUIERDA"});
    node.left  = await this._insert(node.left,  pt, depth+1, node.id);
  }else{
    enqueue({action:"log", msg:"    ↳ SUCCESSOR = HISON → DERECHA"});
    node.right = await this._insert(node.right, pt, depth+1, node.id);
  }
  return node;
}


_existeSuperKey(n, P){
  while(n){
    const cmp = this._cmpSuperKey(P, n.point, n.depth & 1);
    if (cmp === 0) return true;
    n = (cmp < 0) ? n.left : n.right;
  }
  return false;
}


_cmpSuperKey(A, B, j){

  if (A[0] === B[0] && A[1] === B[1]) return 0;


  for (let k=0;k<2;k++){
    const idx = (j + k) & 1;      // (j+k) mod 2
    if (A[idx] < B[idx]) return -1;
    if (A[idx] > B[idx]) return  1;
  }
  return 0;                       // sólo ocurre si idénticos
}






_pausa(f=1){                    
  return new Promise(r=>setTimeout(r, getAnimationSpeed()*0.3*f));
}
async _circVisita(n,eje){        
  enqueue({action:"setVisitedNode",id:n.id});
  enqueue({action:"highlightNode", id:n.id, axis:eje});
  await this._pausa();           
  enqueue({action:"unhighlightNode", id:n.id});
  enqueue({action:"setVisitedNode",  id:null});
}
async _circNaranja(n,eje){       
  enqueue({action:"highlightNode", id:n.id, axis:eje});
  flashOrange(n.id, getAnimationSpeed()*0.3);
  await this._pausa();
}






_lado(padre,hijo){
  return (hijo.point[padre.depth&1] < padre.point[padre.depth&1]) ?"left":"right";
}

async _deslizar(id, destino, dx){
  const n = nodes.get(id); if(!n) return;
  const x0=n.x, y0=n.y, x1=destino._finalX+dx, y1=destino._finalY;
  const pasos=20;
  for(let i=1;i<=pasos;i++){
    const t=i/pasos;
    enqueue({action:"moveNode",id,
             x:x0+(x1-x0)*t, y:y0+(y1-y0)*t});
    await new Promise(r=>setTimeout(r, getAnimationSpeed()/pasos));
  }
}


async _buscarPadre(x,y){
  let padre=null, cur=this.root, d=0;
  while(cur){
    await this._circVisita(cur,d&1);
    if(cur.point[0]===x && cur.point[1]===y){
      flashOrange(cur.id);
      break; 
    } 
    padre=cur;
    cur=((d&1)? (y<cur.point[1]) : (x<cur.point[0]))?cur.left:cur.right;
    d++;
  }
  return {padre, nodo:cur};
}




async _minReal(n, eje){
  if(!n) return null;
  const cur = n.depth & 1;


  haloOrangeRing(n.id, eje);
  await this._pausa();                       // pausa breve


  if((cur === eje && !n.left) || (cur !== eje && !n.left && !n.right)){
    flashOrange(n.id);                       // relleno naranja
    await this._pausa();
    return n;
  }


  if(cur === eje)           // sólo rama izquierda importa
    return await this._minReal(n.left, eje);

  const a = await this._minReal(n.left , eje),
        b = await this._minReal(n.right, eje);
  return (!a || (b && b.point[eje] < a.point[eje])) ? b : a;
}


async _maxReal(n, eje){
  if(!n) return null;
  const cur = n.depth & 1;

  haloOrangeRing(n.id, eje);
  await this._pausa();

  if((cur === eje && !n.right) || (cur !== eje && !n.left && !n.right)){
    flashOrange(n.id);
    await this._pausa();
    return n;
  }

  if(cur === eje)
    return await this._maxReal(n.right, eje);

  const a = await this._maxReal(n.left , eje),
        b = await this._maxReal(n.right, eje);
  return (!a || (b && b.point[eje] > a.point[eje])) ? b : a;
}



async _liberar(P){               // devuelve nodo sustituto o null
  if(!P.left && !P.right) return null;      // hoja

  const eje=P.depth&1, usarDer=!!P.right;
  const Q = usarDer ? await this._minReal(P.right,eje)
                    : await this._maxReal(P.left ,eje);

  flashOrange(Q.id); await this._pausa();


  let padreQ=P[usarDer?"right":"left"], prev=P;
  while(padreQ && padreQ!==Q){ prev=padreQ; padreQ=usarDer?padreQ.left:padreQ.right; }
  padreQ=prev===Q?null:prev;                // null si Q es hijo directo de P

  const rep=await this._liberar(Q);         // recursión profunda


  if(padreQ){
    const lado=this._lado(padreQ,Q);
    if(rep){ connectIfMissing(padreQ.id,rep.id); await this._pausa(0.5);}
    removeEdge(padreQ.id,Q.id); padreQ[lado]=rep;
  }


  if(Q.left ) removeEdge(Q.id,Q.left.id );
  if(Q.right) removeEdge(Q.id,Q.right.id);
  detachNode(Q.id); flashOnly(Q.id); await this._pausa();


  await this._deslizar(Q.id,P,usarDer?40:-40);


  if(P.left && P.left!==Q ) connectIfMissing(Q.id,P.left.id );
  if(P.right&& P.right!==Q) connectIfMissing(Q.id,P.right.id);


  Q.left  = (P.left ===Q)?null:P.left;
  Q.right = (P.right===Q)?null:P.right;
  Q.parentId=P.parentId;

  P.left=P.right=null;            // P ya sin hijos
  return Q;                       // sube un nivel
}


async delete(ptOrX, maybeY){

  let X, Y;
  if (Array.isArray(ptOrX)){
    [X, Y] = ptOrX.map(Number);          // mismo formato que insert
  }else{
    X = Number(ptOrX);
    Y = Number(maybeY);
  }
  enqueue({action:"log",msg:"────────────"});
  enqueue({action:"log",msg:`ELIMINAR punto (${X},${Y})`});

  const {padre:padreP,nodo:P}=await this._buscarPadre(X,Y);
  if(!P){ enqueue({action:"log",msg:"• Punto no encontrado"}); return; }


  if(!P.left && !P.right){
    if (padreP){
      padreP[this._lado(padreP, P)] = null;  
    } else {
      this.root = null;                       
    }
    flashAndRemove(P.id); enqueue({action:"reLayout"}); return;
  }


  const sucesor=await this._liberar(P);


  if(padreP){
    const lado=this._lado(padreP,P);
    padreP[lado]=sucesor;
    connectIfMissing(padreP.id,sucesor.id); await this._pausa(0.5);
    removeEdge(padreP.id,P.id);
  }else{
    this.root=sucesor; sucesor.parentId=null;
  }


  if(P.left ) removeEdge(P.id,P.left.id );
  if(P.right) removeEdge(P.id,P.right.id);
  detachNode(P.id); flashAndRemove(P.id);

  enqueue({action:"reLayout"});
}




  



  _findMin(n,a,d){
    if(!n) return null;
    const cur=d%2;
    if(cur===a) return n.left ? this._findMin(n.left,a,d+1) : n;
    const l=this._findMin(n.left,a,d+1), r=this._findMin(n.right,a,d+1);
    let m=n;
    if(l&&l.point[a]<m.point[a]) m=l;
    if(r&&r.point[a]<m.point[a]) m=r;
    return m;
  }
  _findMax(n,a,d){
    if(!n) return null;
    const cur=d%2;
    if(cur===a) return n.right?this._findMax(n.right,a,d+1):n;
    const l=this._findMax(n.left,a,d+1), r=this._findMax(n.right,a,d+1);
    let m=n;
    if(l&&l.point[a]>m.point[a]) m=l;
    if(r&&r.point[a]>m.point[a]) m=r;
    return m;
  }
  _findById(n,id){
    if(!n) return null;
    if(n.id===id) return n;
    return this._findById(n.left,id) || this._findById(n.right,id);
  }



quickInsert(pt){
  const P = Array.isArray(pt) ? pt.map(Number) : [];   // por si acaso


  if (this._existeSuperKey(this.root, P)) return null;


  this._lastQuick = null;                              
  this.root = this._qInsert(this.root, P, 0, null);

  return this._lastQuick;                              // último nodo creado
}

_qInsert(n, pt, depth, parentId){
  if (!n){

    const k = new KDNode(pt, depth);
    k.parentId = parentId;
    this._lastQuick = k;


    enqueue({action:"createNode", node:k});
    if (parentId !== null) enqueue({action:"addEdge", from:parentId, to:k.id});

    return k;
  }

  const j   = depth & 1;                     // eje discriminante
  const cmp = this._cmpSuperKey(pt, n.point, j);

  if (cmp < 0){          // LOSON
    n.left  = this._qInsert(n.left , pt, depth+1, n.id);
  }else if (cmp > 0){     // HISON
    n.right = this._qInsert(n.right, pt, depth+1, n.id);
  }
  return n;
}
}
export function haloOrangeRing(id, eje, ms = 300){
  enqueue({action:"highlightNode", id, axis:eje});   // eje fijo
  setTimeout(() => enqueue({action:"unhighlightNode", id}), ms);
}

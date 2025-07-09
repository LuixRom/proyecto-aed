
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


    async insert(point){
      const pendingId = KDNode._nextId;
  
      enqueue({ action:"log", msg:"────────────" });
      enqueue({ action:"log",
                msg:`Insertando punto (${point[0]}, ${point[1]})` });
  
      enqueue({ action:"createPendingNode", point, id:pendingId });
  
      this.root = await this._insert(this.root, point, 0, null);
  
      enqueue({ action:"reLayout" });
  
      let layoutNode=null;
      for(let i=0;i<50;i++){
        layoutNode = this._findById(this.root, pendingId);
        if(layoutNode && layoutNode._finalX !== undefined) break;
        await new Promise(r=>setTimeout(r,20));
      }
      const { _finalX:finalX, _finalY:finalY } = layoutNode;
  
      if(layoutNode.parentId!==null)
        enqueue({ action:"attachDynamicEdge", fromId:layoutNode.parentId });
  
      const steps=20;
      for(let i=0;i<=steps;i++){
        const t=i/steps;
        const x = 50  + (finalX-50)  * t;
        const y = 250 + (finalY-250) * t;
        enqueue({ action:"movePendingNode", x, y });
        if(layoutNode.parentId!==null)
          enqueue({ action:"updateDynamicEdgeTo", x, y });
        await new Promise(r=>setTimeout(r,getAnimationSpeed()/steps));
      }
  
      enqueue({ action:"finalizePendingNode" });
      setTimeout(()=>enqueue({ action:"reLayout" }),200);
    }
  
    async _insert(node, point, depth, parentId){
      if(!node){
        enqueue({ action:"log",
                  msg:`  └─ Subárbol vacío → se crea nodo (${point[0]}, ${point[1]})`});
        const n = new KDNode(point, depth);
        n.parentId = parentId;
        return n;
      }
  
      const axis = depth % 2;         
      const coord = axis===0 ? "x" : "y";
  
      /* comparar */
      enqueue({ action:"setVisitedNode", id:node.id });
      enqueue({ action:"highlightNode",  id:node.id, axis });
      enqueue({ action:"setPendingAxis", axis });
      enqueue({ action:"log",
                msg:`  • Comparando ${coord}: ${point[axis]} con ${node.point[axis]}`});
  
      await new Promise(r=>setTimeout(r,getAnimationSpeed()));
  
      enqueue({ action:"unhighlightNode", id:node.id });
      enqueue({ action:"setVisitedNode", id:null });
      enqueue({ action:"clearPendingAxis" });
  
      if(point[axis] < node.point[axis]){
        enqueue({ action:"log",
                  msg:`    ↳ ${point[axis]} < ${node.point[axis]} → bajar IZQUIERDA`});
        node.left  = await this._insert(node.left, point, depth+1, node.id);
      }else{
        enqueue({ action:"log",
                  msg:`    ↳ ${point[axis]} ≥ ${node.point[axis]} → bajar DERECHA`});
        node.right = await this._insert(node.right, point, depth+1, node.id);
      }
      return node;
    }

  



_pausa(f=1){                     // delay proporcional a la velocidad global
  return new Promise(r=>setTimeout(r, getAnimationSpeed()*0.3*f));
}
async _circVisita(n,eje){        // verde-azul (sólo en _buscarPadre)
  enqueue({action:"setVisitedNode",id:n.id});
  enqueue({action:"highlightNode", id:n.id, axis:eje});
  await this._pausa();           // pausa breve
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

async _buscarPadre(x, y){
  let padre = null,
      cur   = this.root,
      d     = 0;
  while (cur){
    await this._circVisita(cur, d & 1);      // halo verde-azul
    if (cur.point[0] === x && cur.point[1] === y){
      flashOrange(cur.id);                   // lo encontramos
      break;
    }
    padre = cur;
    cur   = (d & 1) ?                       // eje Y en niveles impares
            (y < cur.point[1] ? cur.left : cur.right) :
            (x < cur.point[0] ? cur.left : cur.right);
    d++;
  }
  return { padre, nodo: cur };
}

async _minReal(n, eje){
  if (!n) return null;

  const disc = n.depth & 1;          // eje que discrimina este nodo
  await this._circNaranja(n, eje);   // circunf. naranja eje fijo

  if (disc === eje){
    if (n.left) return await this._minReal(n.left, eje);
    return n;
  }

  let best = n;

  const a = await this._minReal(n.left , eje);
  const b = await this._minReal(n.right, eje);

  if (a && a.point[eje] < best.point[eje]) best = a;
  if (b && b.point[eje] < best.point[eje]) best = b;

  return best;
}

async _maxReal(n, eje){
  if (!n) return null;

  const disc = n.depth & 1;
  await this._circNaranja(n, eje);

  if (disc === eje){
    if (n.right) return await this._maxReal(n.right, eje);
    return n;                          // sin hijo derecho ⇒ máximo
  }

  let best = n;

  const a = await this._maxReal(n.left , eje);
  const b = await this._maxReal(n.right, eje);

  if (a && a.point[eje] > best.point[eje]) best = a;
  if (b && b.point[eje] > best.point[eje]) best = b;

  return best;
}

async _liberar(P){
  if (!P.left && !P.right) return null;        // era hoja

  const eje   = P.depth & 1;                  // eje de P
  const usarD = !!P.right;                    

  const Q = usarD ?
            await this._minReal(P.right, eje) :
            await this._maxReal(P.left , eje);

  flashOrange(Q.id);  await this._pausa();

  let padreQ = usarD ? P.right : P.left, prev = P;
  while (padreQ && padreQ !== Q){
    prev   = padreQ;
    padreQ = usarD ? padreQ.left : padreQ.right;
  }
  padreQ = (prev === Q) ? null : prev;

  if (padreQ){
    const lado = this._lado(padreQ, Q);
    padreQ[lado] = null;
    removeEdge(padreQ.id, Q.id);
  }

  const rep = await this._liberar(Q);         // suele ser null
  if (padreQ && rep){
    const lado = this._lado(padreQ, Q);
    padreQ[lado] = rep;
    rep.parentId = padreQ.id;
    connectIfMissing(padreQ.id, rep.id);
    await this._pausa(0.5);
  }


  if (Q.left ) removeEdge(Q.id, Q.left.id );
  if (Q.right) removeEdge(Q.id, Q.right.id);
  detachNode(Q.id);       // quita TODAS las aristas de Q en el canvas

  await this._deslizar(Q.id, P, usarD ? 40 : -40);

  Q.left  = P.left;
  if (Q.left)  { Q.left.parentId  = Q.id; connectIfMissing(Q.id, Q.left.id ); }

  Q.right = P.right;
  if (Q.right) { Q.right.parentId = Q.id; connectIfMissing(Q.id, Q.right.id ); }

  Q.parentId = P.parentId;


  P.left = P.right = null;
  flashOnly(P.id);   await this._pausa();

  return Q;   // se coloca en el lugar de P
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
      padreP[this._lado(padreP, P)] = null;   // desconecta del padre
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




  


  /* ═════════════ helpers find  ═════════════ */
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

    /* quickInsert (undo) */
  quickInsert(pt){
    this.root = this._quickInsert(this.root, pt, 0);
    return this._lastQuick;
  }
  _quickInsert(n,pt,d){
    if(!n){ const k=new KDNode(pt,d); this._lastQuick=k; return k; }
    const ax=d%2;
    if(pt[ax]<n.point[ax]) n.left = this._quickInsert(n.left,pt,d+1);
    else                   n.right= this._quickInsert(n.right,pt,d+1);
    return n;
  }
}
export function haloOrangeRing(id, eje, ms = 300){
  enqueue({action:"highlightNode", id, axis:eje});   // eje fijo
  setTimeout(() => enqueue({action:"unhighlightNode", id}), ms);
}

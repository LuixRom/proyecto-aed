/* KD-Tree 2-D con animación completa
   – Inserción   (idéntica a la versión buena)
   – Eliminación (animada según la secuencia descrita)
   – quickInsert (para “Undo”)
*/
import { enqueue, getAnimationSpeed } from "../AnimationMain.js";
import { enqueueTask }                     from "../AnimationMain.js";
import {
  /* mapa visual + helpers --------------------------------------------- */
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



  /* ═══════════════════════ INSERCIÓN COMPLETA ═══════════════════════ */
async insert(pt){
  /* 0 · normaliza entrada y verifica formato ------------------------- */
  if (!Array.isArray(pt) || pt.length !== 2){
    enqueue({action:"log", msg:"• Formato de punto incorrecto"}); return;
  }
  const P = pt.map(Number);

  /* 1 · duplicado global con super-key -------------------------------- */
  if (this._existeSuperKey(this.root, P)){
    enqueue({action:"log", msg:"• Punto duplicado — inserción ignorada"});
    enqueue({action:"discardPendingNode"});
    return;
  }

  /* 2 · crea nodo “pendiente” azul ----------------------------------- */
  const pendingId = KDNode._nextId;
  enqueue({action:"log", msg:"────────────"});
  enqueue({action:"log", msg:`Insertando punto (${P})`});
  enqueue({action:"createPendingNode", point:P, id:pendingId});

  /* 3 · inserción recursiva con super-key ---------------------------- */
  this.root = await this._insert(this.root, P, 0, null);
  enqueue({action:"reLayout"});

  /* 4 · anima la “caída” del nodo azul ------------------------------- */
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

/* ───── inserción recursiva **con super-key** en cada nivel ───── */
async _insert(node, pt, depth, parentId){
  if(!node){
    enqueue({action:"log", msg:`  └─ Subárbol vacío → se crea nodo (${pt})`});
    const n = new KDNode(pt, depth); n.parentId = parentId; return n;
  }

  /* 1 · compara super-key Sⱼ ---------------------------------------- */
  const j   = depth & 1;                       // eje discriminante
  const cmp = this._cmpSuperKey(pt, node.point, j);

  /* 2 · animación de comparación (muestra sólo eje j) --------------- */
  enqueue({action:"setVisitedNode", id:node.id});
  enqueue({action:"highlightNode" , id:node.id, axis:j});
  enqueue({action:"setPendingAxis", axis:j});
  enqueue({action:"log",
           msg:`  • Comparando eje ${j?'y':'x'}: ${pt[j]} con ${node.point[j]}`});
  await new Promise(r=>setTimeout(r,getAnimationSpeed()));
  enqueue({action:"unhighlightNode", id:node.id});
  enqueue({action:"setVisitedNode",  id:null});
  enqueue({action:"clearPendingAxis"});

  /* 3 · decisión según cmp ------------------------------------------ */
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

/* ───── detección de duplicados con super-key ------------------------ */
_existeSuperKey(n, P){
  while(n){
    const cmp = this._cmpSuperKey(P, n.point, n.depth & 1);
    if (cmp === 0) return true;
    n = (cmp < 0) ? n.left : n.right;
  }
  return false;
}

/* ───── comparación de super-keys Sⱼ(A) vs Sⱼ(B)  (-1 / 0 / 1) ------ */
_cmpSuperKey(A, B, j){
  /* igualdad total ➜ 0 */
  if (A[0] === B[0] && A[1] === B[1]) return 0;

  /* (k = 2)  ⇒  Sⱼ = Kⱼ Kⱼ₊₁  (cíclico) */
  for (let k=0;k<2;k++){
    const idx = (j + k) & 1;      // (j+k) mod 2
    if (A[idx] < B[idx]) return -1;
    if (A[idx] > B[idx]) return  1;
  }
  return 0;                       // sólo ocurre si idénticos
}


/* ════════════════  helper: compara en 1 eje usando la super-key  ══════════════
   Devuelve −1  si a < b         (según eje)
             0   si iguales
             1   si a > b                                                         */
_cmp1D(a, b, eje){
  if (a[eje] < b[eje]) return -1;
  if (a[eje] > b[eje]) return  1;
  /* empate ⇒ mirar la otra coordenada (cíclico) */
  const otro = eje ^ 1;              // 0↔1
  if (a[otro] < b[otro]) return -1;
  if (a[otro] > b[otro]) return  1;
  return 0;                          // puntos idénticos
}




  /* ═════════════════════  B O R R A R  ═════════════════════ */

/* ───── helpers internos (privados) ─────────────────── */
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
async _circNaranja(n,eje){       // circunferencia “naranja” eje-fijo
  enqueue({action:"highlightNode", id:n.id, axis:eje});
  flashOrange(n.id, getAnimationSpeed()*0.3);
  await this._pausa();
}





/* ───── SUPER-KEY   left / right  (“LOSON / HISON”) ───── */
_lado(padre, hijo){
  const j   = padre.depth & 1;                 // eje discriminante del padre
  return (this._cmpSuperKey(hijo.point, padre.point, j) < 0) ? "left" : "right";
}

/* ───── desplazamiento lateral con animación ─────────── */
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


/* ───── BUSCAR nodo + padre   CON SUPER-KEY ───────────── */
async _buscarPadre(x, y){
  const P = [ Number(x), Number(y) ];

  let padre = null,
      cur   = this.root,
      depth = 0;

  while(cur){
    /* animación de visita (verde-azul) */
    await this._circVisita(cur, depth & 1);

    /* ¿lo hemos encontrado? */
    if (cur.point[0] === P[0] && cur.point[1] === P[1]){
      flashOrange(cur.id);                     // candidato naranja
      break;
    }

    /* decide LOSON / HISON con la super-key Sⱼ */
    const j   = depth & 1;                     // eje actual
    const dir = this._cmpSuperKey(P, cur.point, j) < 0 ? "left" : "right";

    padre = cur;
    cur   = cur[dir];
    depth++;
  }
  return { padre, nodo: cur };
}

/* ════════════════  mínimo REAL en el eje «eje»  ══════════════════════════════ */
async _minReal(n, eje){
  if (!n) return null;

  const disc = n.depth & 1;           // eje discriminante del nodo
  haloOrangeRing(n.id, eje);          // halo naranja
  await this._pausa();

  /* ─ caso 1: discrimina por ese eje → sólo sub-árbol izquierdo ─ */
  if (disc === eje){
    if (!n.left){
      flashOrange(n.id);              // se alcanzó el mínimo
      await this._pausa();
      return n;
    }
    return await this._minReal(n.left, eje);
  }

  /* ─ caso 2: otro eje → mínimo = arg-min{ n , min(izq) , min(der) } ─ */
  const izq  = await this._minReal(n.left , eje);
  const der  = await this._minReal(n.right, eje);

  let best = n;
  if (izq && this._cmp1D(izq.point, best.point, eje) < 0) best = izq;
  if (der && this._cmp1D(der.point, best.point, eje) < 0) best = der;

  /* si el mejor es el nodo actual, aún no se ha pintado en sólido */
  if (best === n){
    flashOrange(n.id);
    await this._pausa();
  }
  return best;
}

/* ════════════════  máximo REAL en el eje «eje»  ══════════════════════════════ */
async _maxReal(n, eje){
  if (!n) return null;

  const disc = n.depth & 1;
  haloOrangeRing(n.id, eje);
  await this._pausa();

  if (disc === eje){
    if (!n.right){
      flashOrange(n.id);
      await this._pausa();
      return n;
    }
    return await this._maxReal(n.right, eje);
  }

  const izq  = await this._maxReal(n.left , eje);
  const der  = await this._maxReal(n.right, eje);

  let best = n;
  if (izq && this._cmp1D(izq.point, best.point, eje) > 0) best = izq;
  if (der && this._cmp1D(der.point, best.point, eje) > 0) best = der;

  if (best === n){
    flashOrange(n.id);
    await this._pausa();
  }
  return best;
}


/* ───── liberar sucesor (pasos 1-4) ──────────────────── */
async _liberar(P){               // devuelve nodo sustituto o null
  if(!P.left && !P.right) return null;      // hoja

  const eje=P.depth&1, usarDer=!!P.right;
  const Q = usarDer ? await this._minReal(P.right,eje)
                    : await this._maxReal(P.left ,eje);

  flashOrange(Q.id); await this._pausa();

  /* localizar padre de Q sin animar */
  let padreQ=P[usarDer?"right":"left"], prev=P;
  while(padreQ && padreQ!==Q){ prev=padreQ; padreQ=usarDer?padreQ.left:padreQ.right; }
  padreQ=prev===Q?null:prev;                // null si Q es hijo directo de P

  const rep=await this._liberar(Q);         // recursión profunda

  /* conectar rep → padreQ, quitar Q → padreQ */
  if(padreQ){
    const lado=this._lado(padreQ,Q);
    if(rep){ connectIfMissing(padreQ.id,rep.id); await this._pausa(0.5);}
    removeEdge(padreQ.id,Q.id); padreQ[lado]=rep;
  }

  /* quitar aristas de Q → hijos */
  if(Q.left ) removeEdge(Q.id,Q.left.id );
  if(Q.right) removeEdge(Q.id,Q.right.id);
  detachNode(Q.id); flashOnly(Q.id); await this._pausa();

  /* mover Q al costado de P */
  await this._deslizar(Q.id,P,usarDer?40:-40);

  /* aristas Q → hijos de P */
  if(P.left && P.left!==Q ) connectIfMissing(Q.id,P.left.id );
  if(P.right&& P.right!==Q) connectIfMissing(Q.id,P.right.id);

  /* re-ligado lógico */
  Q.left  = (P.left ===Q)?null:P.left;
  Q.right = (P.right===Q)?null:P.right;
  Q.parentId=P.parentId;

  P.left=P.right=null;            // P ya sin hijos
  return Q;                       // sube un nivel
}

/* ───── API PÚBLICO delete(x,y) ───────────────────────── */
async delete(ptOrX, maybeY){
  /* ── admitir [x,y] o bien (x,y) ── */
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

  /* caso hoja trivial */
  if(!P.left && !P.right){
    if (padreP){
      padreP[this._lado(padreP, P)] = null;   // desconecta del padre
    } else {
      this.root = null;                       // ← IMPORTANTE
    }
    flashAndRemove(P.id); enqueue({action:"reLayout"}); return;
  }

  /* parte recursiva (pasos 1-4) */
  const sucesor=await this._liberar(P);

  /* conectar sucesor con el padre de P (o convertirlo en raíz) */
  if(padreP){
    const lado=this._lado(padreP,P);
    padreP[lado]=sucesor;
    connectIfMissing(padreP.id,sucesor.id); await this._pausa(0.5);
    removeEdge(padreP.id,P.id);
  }else{
    this.root=sucesor; sucesor.parentId=null;
  }

  /* quitar aristas residuales de P y borrarlo físicamente */
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

  /* ═══════════════  Inserción RÁPIDA (Undo)  ═══════════════
   — sin animación, pero con la MISMA lógica de super-key   */

quickInsert(pt){
  const P = Array.isArray(pt) ? pt.map(Number) : [];   // por si acaso

  /* 0 · duplicado -> no se inserta */
  if (this._existeSuperKey(this.root, P)) return null;

  /* 1 · reconstruye el sub-árbol */
  this._lastQuick = null;                              // ← devuelto al caller
  this.root = this._qInsert(this.root, P, 0, null);

  return this._lastQuick;                              // último nodo creado
}

/* --- versión NO animada: usa super-key y crea nodos/aristas ---------- */
_qInsert(n, pt, depth, parentId){
  if (!n){
    /* crea nodo lógicamente… */
    const k = new KDNode(pt, depth);
    k.parentId = parentId;
    this._lastQuick = k;

    /* …y visualmente (para que aparezca al final del Undo) */
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
  /* (cmp === 0) nunca ocurre: duplicado filtrado antes */
  return n;
}





}
export function haloOrangeRing(id, eje, ms = 300){
  enqueue({action:"highlightNode", id, axis:eje});   // eje fijo
  setTimeout(() => enqueue({action:"unhighlightNode", id}), ms);
}
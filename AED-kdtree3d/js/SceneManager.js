import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setClearColor(0x111111);

    this.scene  = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(5, 5, 5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(20, 30, 20);
    const amb = new THREE.AmbientLight(0x666666);
    this.scene.add(dir, amb);

    this.scene.add(new THREE.AxesHelper(12));

    this.objects = [];
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const { clientWidth:w, clientHeight:h } = this.renderer.domElement;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  add(o){ this.scene.add(o); this.objects.push(o); }
  clear(){ this.objects.forEach(o=>this.scene.remove(o)); this.objects=[]; }
  render(){ this.controls.update(); this.renderer.render(this.scene,this.camera); }
}

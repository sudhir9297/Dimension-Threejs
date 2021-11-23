import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  LoadingManager,
  ShaderMaterial,
  DoubleSide,
  Vector4,
  BoxBufferGeometry,
  Mesh,
} from "three";
import { OrbitControls } from "./utils/orbitControl";
import { OrbitControlsGizmo } from "./utils/Gizmo";

import HdrFile from "../hdr/default.hdr";
import { HDRMapLoader } from "./manager/textureLoader";

import { Pane } from "tweakpane";

import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";

export default class Sketch {
  constructor(options) {
    this.scene = new Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x151515, 1);

    this.container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(2, 2, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controlsGizmo = new OrbitControlsGizmo(this.controls, {
      size: 100,
      padding: 8,
    });

    this.container.appendChild(this.controlsGizmo.domElement);

    this.time = 0;

    this.isPlaying = true;

    this.manager = new LoadingManager();
    this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const ProgressVal = (itemsLoaded / itemsTotal) * 100;

      if (ProgressVal === 100) {
        console.log("Scene Loaded");
      }
    };

    this.addObjects();
    this.resize();
    this.render();

    this.loadHDR();
    this.settings();

    window.addEventListener("resize", this.resize);
  }

  loadHDR = () => {
    HDRMapLoader(HdrFile, this.renderer, this.scene, this.manager);
  };

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.pane = new Pane({ title: "Parameters" });
  }

  resize = () => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  };

  addObjects() {
    let that = this;
    this.material = new ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new BoxBufferGeometry(1, 1, 1);

    this.plane = new Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});

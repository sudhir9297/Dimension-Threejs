import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  LoadingManager,
  BoxBufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  ACESFilmicToneMapping,
  sRGBEncoding,
  BoxHelper,
} from "three";
import { OrbitControls } from "./utils/orbitControl";
import { OrbitControlsGizmo } from "./utils/Gizmo";

import { RayysFacingCamera } from "./utils/RayysFacingCamera";
import { RayysLinearDimension } from "./utils/RayysLinearDimension";

import { ModelLoader } from "./manager/modelManager";

import HdrFile from "../hdr/default.hdr";
import { HDRMapLoader } from "./manager/textureLoader";

import { Pane } from "tweakpane";

export default class Sketch {
  constructor(options) {
    this.scene = new Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x8fb9ab, 1);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.toneMappingExposure = 1;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controlsGizmo = new OrbitControlsGizmo(this.controls, {
      size: 100,
      padding: 8,
    });
    this.container.appendChild(this.controlsGizmo.domElement);

    this.facingCamera = new RayysFacingCamera(this.camera);
    this.dim0 = new RayysLinearDimension(
      this.container,
      this.renderer,
      this.camera
    );
    this.dim1 = new RayysLinearDimension(
      this.container,
      this.renderer,
      this.camera
    );
    this.dim2 = new RayysLinearDimension(
      this.container,
      this.renderer,
      this.camera
    );

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

  settings = () => {
    let that = this;
    this.settings = {
      transform: { x: 12, y: 14, z: 18 },
    };
    this.pane = new Pane({ title: "Parameters" });
  };

  resize = () => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  };

  addObjects = () => {
    let that = this;
    const Sphere =
      "https://default-vessel.s3.ap-south-1.amazonaws.com/s_glb.glb";

    this.loader = new ModelLoader();
    const model = this.loader.loadFromUrl(Sphere);

    model.then((gltf) => {
      this.addDimension(gltf.scene.children[0]);
      const box = new BoxHelper(gltf.scene.children[0], 0xffff00);
      this.scene.add(box);
      this.scene.add(gltf.scene);
    });

    this.material = new MeshStandardMaterial();
    this.geometry = new BoxBufferGeometry(12, 14, 18);
    this.Box = new Mesh(this.geometry, this.material);
    this.Box.geometry.computeBoundingBox();
    // const box = new BoxHelper(this.Box, 0xffff00);
    // this.scene.add(box);
    // this.scene.add(this.Box);
    // this.addDimension(this.Box);
  };

  addDimension = (mesh) => {
    mesh.geometry.computeBoundingBox();

    this.facingCamera.cb.facingDirChange.push((event) => {
      let facingDir = this.facingCamera.dirs[event.current.best];

      if (this.dim0.node !== undefined) {
        this.dim0.detach();
      }
      if (this.dim1.node !== undefined) {
        this.dim1.detach();
      }
      if (this.dim2.node !== undefined) {
        this.dim2.detach();
      }

      var bbox = mesh.geometry.boundingBox;

      if (Math.abs(facingDir.x) === 1) {
        let from = new Vector3(bbox.min.x, bbox.min.y, bbox.min.z);
        let to = new Vector3(bbox.max.x, bbox.min.y, bbox.max.z);
        let newDimension = this.dim0.create(from, to, facingDir);
        mesh.add(newDimension);

        let from2 = new Vector3(bbox.max.x, bbox.min.y, bbox.max.z);
        let to2 = new Vector3(bbox.max.x, bbox.max.y, bbox.max.z);
        let newDimension2 = this.dim2.create(from2, to2, { x: 0, y: 0, z: 1 });
        mesh.add(newDimension2);
      }
      if (Math.abs(facingDir.z) === 1) {
        let from = new Vector3(bbox.min.x, bbox.min.y, bbox.min.z);
        let to = new Vector3(bbox.max.x, bbox.min.y, bbox.max.z);
        let newDimension = this.dim1.create(from, to, facingDir);
        mesh.add(newDimension);

        let from2 = new Vector3(bbox.min.x, bbox.min.y, bbox.max.z);
        let to2 = new Vector3(bbox.min.x, bbox.max.y, bbox.max.z);
        let newDimension2 = this.dim2.create(from2, to2, { x: -1, y: 0, z: 0 });
        mesh.add(newDimension2);
      }
      if (Math.abs(facingDir.y) === 1) {
        let newArray = event.current.facing.slice();
        let bestIdx = newArray.indexOf(event.current.best);
        newArray.splice(bestIdx, 1);

        let facingDir0 = this.facingCamera.dirs[newArray[0]];
        let facingDir1 = this.facingCamera.dirs[newArray[1]];

        let from = new Vector3(bbox.min.x, bbox.min.y, bbox.min.z);
        let to = new Vector3(bbox.max.x, bbox.min.y, bbox.max.z);

        let newDimension0 = this.dim0.create(from, to, facingDir0);
        let newDimension1 = this.dim1.create(from, to, facingDir1);

        let from2 = new Vector3(bbox.max.x, bbox.min.y, bbox.min.z);
        let to2 = new Vector3(bbox.max.x, bbox.max.y, bbox.min.z);
        let newDimension2 = this.dim2.create(from2, to2, { x: 1, y: 0, z: 0 });

        mesh.add(newDimension0);
        mesh.add(newDimension1);
        mesh.add(newDimension2);
      }
    });
  };

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
    this.facingCamera.check(this.camera);
    this.dim0.update(this.camera);
    this.dim1.update(this.camera);
    this.dim2.update(this.camera);
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});

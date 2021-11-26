import { Object3D, Vector3, ArrowHelper } from "three";

export class RayysLinearDimension {
  constructor(domRoot, renderer, camera) {
    this.domRoot = domRoot;
    this.renderer = renderer;
    this.camera = camera;

    this.cb = {
      onChange: [],
    };
    this.config = {
      headLength: 0.1,
      headWidth: 0.1,
      units: "mm",
      unitsConverter: function (v) {
        return v;
      },
    };
  }

  create(p0, p1, extrude) {
    this.from = p0;
    this.to = p1;
    this.extrude = extrude;

    this.node = new Object3D();
    this.hidden = undefined;

    let el = document.createElement("div");
    el.id = this.node.id;
    el.classList.add("dim");
    el.style.left = "100px";
    el.style.top = "100px";
    el.innerHTML = "";
    this.domRoot.appendChild(el);
    this.domElement = el;

    this.update(this.camera);

    return this.node;
  }

  update(camera) {
    this.camera = camera;

    // re-create arrow
    if (!this.node) {
      return;
    }
    this.node.children.length = 0;

    let p0 = this.from;
    let p1 = this.to;
    let extrude = this.extrude;

    var pmin, pmax;
    if (extrude.x >= 0 && extrude.y >= 0 && extrude.z >= 0) {
      pmax = new Vector3(
        extrude.x + Math.max(p0.x, p1.x),
        extrude.y + Math.max(p0.y, p1.y),
        extrude.z + Math.max(p0.z, p1.z)
      );

      pmin = new Vector3(
        extrude.x < 1e-16 ? extrude.x + Math.min(p0.x, p1.x) : pmax.x,
        extrude.y < 1e-16 ? extrude.y + Math.min(p0.y, p1.y) : pmax.y,
        extrude.z < 1e-16 ? extrude.z + Math.min(p0.z, p1.z) : pmax.z
      );
    } else if (extrude.x <= 0 && extrude.y <= 0 && extrude.z <= 0) {
      pmax = new Vector3(
        extrude.x + Math.min(p0.x, p1.x),
        extrude.y + Math.min(p0.y, p1.y),
        extrude.z + Math.min(p0.z, p1.z)
      );

      pmin = new Vector3(
        extrude.x > -1e-16 ? extrude.x + Math.max(p0.x, p1.x) : pmax.x,
        extrude.y > -1e-16 ? extrude.y + Math.max(p0.y, p1.y) : pmax.y,
        extrude.z > -1e-16 ? extrude.z + Math.max(p0.z, p1.z) : pmax.z
      );
    }

    var origin = pmax.clone().add(pmin).multiplyScalar(0.5);
    var dir = pmax.clone().sub(pmin);
    dir.normalize();

    var length = pmax.distanceTo(pmin) / 2;
    var hex = 0xffffff;
    var arrowHelper0 = new ArrowHelper(
      dir,
      origin,
      length,
      hex,
      this.config.headLength,
      this.config.headWidth
    );

    // var scaleVector = new Vector3();
    // var scaleFactor = 4;

    // var distance = scaleVector
    //   .subVectors(arrowHelper0.position, camera.position)
    //   .length();

    // arrowHelper0.scale.set(distance / 10, distance / 10, distance / 10);

    this.node.add(arrowHelper0);

    dir.negate();
    var arrowHelper1 = new ArrowHelper(
      dir,
      origin,
      length,
      hex,
      this.config.headLength,
      this.config.headWidth
    );
    this.node.add(arrowHelper1);

    // reposition label
    if (this.domElement !== undefined) {
      let textPos = origin.project(this.camera);

      let clientX =
        (this.renderer.domElement.offsetWidth * (textPos.x + 1)) / 2 -
        this.config.headLength +
        this.renderer.domElement.offsetLeft;

      let clientY =
        (-this.renderer.domElement.offsetHeight * (textPos.y - 1)) / 2 -
        this.config.headLength +
        this.renderer.domElement.offsetTop;

      let dimWidth = this.domElement.offsetWidth;
      let dimHeight = this.domElement.offsetHeight;

      this.domElement.style.left = `${clientX - dimWidth / 2}px`;
      this.domElement.style.top = `${clientY - dimHeight / 2}px`;

      this.domElement.innerHTML = `${this.config
        .unitsConverter(pmin.distanceTo(pmax))
        .toFixed(2)}${this.config.units}`;
    }
  }

  detach() {
    if (this.node && this.node.parent) {
      this.node.parent.remove(this.node);
    }
    if (this.domElement !== undefined) {
      this.domRoot.removeChild(this.domElement);
      this.domElement = undefined;
    }
  }
}

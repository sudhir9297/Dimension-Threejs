import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export const HDRMapLoader = (url, renderer, scene, manager) => {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  new RGBELoader(manager)
    .setDataType(THREE.UnsignedByteType)
    .load(url, (texture) => {
      var envMap = pmremGenerator.fromEquirectangular(texture).texture;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.format = THREE.RGBFormat;
      texture.needsUpdate = true;
      //   scene.background = envMap;
      scene.environment = envMap;
      texture.dispose();
      pmremGenerator.dispose();
    });
};

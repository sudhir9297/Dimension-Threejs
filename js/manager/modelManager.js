import { REVISION, LoadingManager, LoaderUtils, Box3, Vector3 } from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export class ModelLoader {
  constructor(oldContent) {
    this.manager_ = new LoadingManager();
    this.content_ = oldContent;
  }

  loadFromUrl = (url) => {
    let gltfURL = null;
    if (url.match(/\.(gltf|glb)$/)) {
      gltfURL = url;
    }

    if (gltfURL) {
      const baseURL = LoaderUtils.extractUrlBase(gltfURL);
      return this.loadGltfFile(baseURL, undefined, gltfURL);
    }
  };

  loadFromFileBlob = (fileMap) => {
    let gltfFiles;
    let rootPath;

    Array.from(fileMap).forEach(([path, file]) => {
      if (file.name.match(/\.(gltf|glb)$/)) {
        gltfFiles = file;
        rootPath = path.replace(file.name, "");
      }
    });

    if (!gltfFiles) {
      console.log("No .gltf or .glb asset found.");
    }

    if (gltfFiles) {
      const gltfFileURL = URL.createObjectURL(gltfFiles);
      return this.loadGltfFile(rootPath, fileMap, gltfFileURL);
    }
  };

  loadGltfFile = (rootPath, FileMap, gltfFileUrl) => {
    const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`;
    const DRACO_LOADER = new DRACOLoader(this.manager_).setDecoderPath(
      `${THREE_PATH}/examples/js/libs/draco/gltf/`
    );

    const baseURL = LoaderUtils.extractUrlBase(gltfFileUrl);

    return new Promise((resolve, reject) => {
      this.manager_.setURLModifier((url, path) => {
        const normalizedURL =
          rootPath +
          decodeURI(url)
            .replace(baseURL, "")
            .replace(/^(\.?\/)/, "");

        if (FileMap && FileMap.has(normalizedURL)) {
          const blob = FileMap.get(normalizedURL);
          const blobURL = URL.createObjectURL(blob);
          blobURLs.push(blobURL);
          return blobURL;
        }

        return (path || "") + url;
      });

      const loader = new GLTFLoader(this.manager_)
        .setDRACOLoader(DRACO_LOADER)
        .setMeshoptDecoder(MeshoptDecoder);

      const blobURLs = [];

      loader.load(
        gltfFileUrl,
        (gltf) => {
          gltf.scene.traverse((mesh) => {
            if (mesh.isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.geometry.computeBoundingBox();
            }
          });
          resolve(gltf);
        },
        undefined,
        function (err) {
          reject(err);
        }
      );
    });
  };
}

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('bg');
const pr = Math.min(devicePixelRatio, 2);

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe7eeea);

// Realistic reflections/ambient light (koi HDR file nahi chahiye)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

export const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);

/* MSAA render, bloom nahi (light theme par haze deta hai) */
const target = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, {
  type: THREE.HalfFloatType,
  samples: 4,
});
export const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(pr);
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());

/* ---------- Lights ---------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

// Key light (shadow dene wali)
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(-4, 6, 3);
key.target.position.set(1.5, 0, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
const sc = key.shadow.camera;
sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 25;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);

// Fill (right side, soft) + Rim (peeche se, warm outline)
const fill = new THREE.DirectionalLight(0xdfeaff, 0.6);
fill.position.set(5, 3, 4);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffe2c4, 1.2);
rim.position.set(4, 4, -5);
scene.add(rim);

export const lights = {
  cyan: new THREE.PointLight(0x8ba987, 0.5, 18),
  pink: new THREE.PointLight(0xc8aa88, 0.2, 18),
};
lights.cyan.position.set(-4, 3, 3);
lights.pink.position.set(4, 2, -3);
scene.add(lights.cyan, lights.pink);

/* Resize */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
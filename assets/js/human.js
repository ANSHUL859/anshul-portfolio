import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { scene } from './scene.js';

/* ============ CONFIG ============ */
const CONFIG = {
  model: 'assets/models/model.glb',
  height: 2.1,
  animations: {
    walk: 'assets/animation/Walking.fbx',
    wave: 'assets/animation/Waving.fbx',
    showcase: 'assets/animation/Standing Idle 03.fbx',
  },
};
/* ================================ */

export const HOME_GREETING_DURATION = 3.5;
export const human = new THREE.Group();
scene.add(human);

let mixer = null;
let showcaseHandBone = null;
let showcaseHeadBone = null;
let showcaseNeckBone = null;
const actions = {};
let lastTime = 0;
let homeGreetingStarted = false;
let homeShowcaseStarted = false;

/* ---------- Helpers ---------- */
const norm = (n) => n.toLowerCase().replace(/^mixamorig\d*/, '').replace(/[^a-z0-9]/g, '');

function loadAny(url) {
  const loader = url.toLowerCase().endsWith('.fbx') ? new FBXLoader() : new GLTFLoader();
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
}

// Animation ke bone names ko model ke bone names se match karta hai
function retarget(clip, model) {
  const bones = new Map();
  model.traverse((o) => { if (o.isBone) bones.set(norm(o.name), o.name); });

  const tracks = [];
  clip.tracks.forEach((t) => {
    const m = t.name.match(/^(.*)\.quaternion$/);
    if (!m) return;
    const target = bones.get(norm(m[1]));
    if (!target) return;
    const nt = t.clone();
    nt.name = `${target}.quaternion`;
    tracks.push(nt);
  });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

/* ---------- Load ---------- */
async function init() {
  const asset = await loadAny(CONFIG.model);
  const model = asset.scene || asset;

  // height fit + feet ground par + center
  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model);
  model.scale.multiplyScalar(CONFIG.height / (box.max.y - box.min.y));
  model.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model);
  model.position.x -= (box.min.x + box.max.x) / 2;
  model.position.z -= (box.min.z + box.max.z) / 2;
  model.position.y -= box.min.y;

  // shadows + realistic material tuning
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;

    const mats = Array.isArray(o.material) ? o.material : [o.material];
    // transparent parts (aankh, eyelash) ka ajeeb shadow na pade
    o.castShadow = !mats.some((m) => m && m.transparent);
    mats.forEach((m) => {
      if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.55;
    });
  });
  human.add(model);
  model.traverse((o) => {
    if (!o.isBone) return;
    const boneName = norm(o.name);
    if (boneName === 'righthand') showcaseHandBone = o;
    if (boneName === 'head') showcaseHeadBone = o;
    if (boneName === 'neck') showcaseNeckBone = o;
  });
  if (!showcaseHandBone) {
    console.warn('[human] right hand bone not found; hologram will use its fallback position');
  }

  mixer = new THREE.AnimationMixer(model);

  await Promise.all(Object.entries(CONFIG.animations).map(async ([key, url]) => {
    try {
      const a = await loadAny(url);
      const sourceClip = a.animations[0];
      if (!sourceClip) {
        console.warn(`[human] "${key}": animation file contains no clips`);
        return;
      }
      const clip = retarget(sourceClip, model);
      if (!clip.tracks.length) {
        console.warn(`[human] "${key}": bones match nahi hue (rig alag hai)`);
        return;
      }
      const action = mixer.clipAction(clip);
      if (key === 'showcase') {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.setEffectiveWeight(0);
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.reset();
        action.play();
      }
      actions[key] = action;
      if (key !== 'showcase') action.setEffectiveWeight(key === 'walk' ? 1 : 0);
      console.log(`[human] "${key}" animation ready (${clip.tracks.length} tracks)`);
    } catch (e) {
      console.warn(`[human] animation load nahi hui: ${url}`, e);
    }
  }));
}

init().catch((e) => console.error(`[human] model load fail: ${CONFIG.model}`, e));

export function getShowcaseHandPosition(target) {
  if (!showcaseHandBone) return false;
  showcaseHandBone.getWorldPosition(target);
  return true;
}

/* ---------- Per-frame ---------- */
export function updateHuman({
  run,
  wave,
  time,
  homeVisitTime = 0,
  isHome = false,
  isScrolling = false,
}) {
  const dt = Math.min(Math.max(time - lastTime, 0), 0.05);
  lastTime = time;

  if (!mixer) return;

  if (isHome && !isScrolling) {
    const greetingClipDuration = actions.wave?.getClip().duration || 0;
    const greetingDuration = greetingClipDuration ? HOME_GREETING_DURATION : 0;
    actions.walk?.setEffectiveWeight(0);

    if (actions.wave && homeVisitTime < greetingDuration) {
      if (!homeGreetingStarted) {
        actions.wave.reset();
        actions.wave.setLoop(THREE.LoopOnce, 1);
        actions.wave.clampWhenFinished = true;
        actions.wave.timeScale = greetingClipDuration / greetingDuration;
        actions.wave.enabled = true;
        actions.wave.play();
        homeGreetingStarted = true;
      }
      actions.showcase?.stop();
      actions.showcase?.setEffectiveWeight(0);
      homeShowcaseStarted = false;
      actions.wave.setEffectiveWeight(1);
    } else {
      actions.wave?.stop();
      actions.wave?.setEffectiveWeight(0);
      if (actions.showcase && !homeShowcaseStarted) {
        actions.showcase.reset();
        actions.showcase.setLoop(THREE.LoopRepeat, Infinity);
        actions.showcase.clampWhenFinished = false;
        actions.showcase.enabled = true;
        actions.showcase.play();
        homeShowcaseStarted = true;
      }
      actions.showcase?.setEffectiveWeight(1);
    }

    mixer.update(dt);
    if (homeVisitTime >= HOME_GREETING_DURATION) {
      showcaseNeckBone?.rotateX(-0.08);
      showcaseNeckBone?.rotateY(0.12);
      showcaseHeadBone?.rotateX(-0.18);
      showcaseHeadBone?.rotateY(0.18);
    }
    return;
  }

  actions.showcase?.stop();
  actions.showcase?.setEffectiveWeight(0);
  homeShowcaseStarted = false;
  if (!isHome) homeGreetingStarted = false;

  if (isHome) {
    actions.walk?.setEffectiveWeight(1);
    actions.wave?.setEffectiveWeight(0);
    if (actions.walk) actions.walk.timeScale = 0.9 + run * 0.9;
    mixer.update(dt);
    return;
  }

  if (actions.wave) {
    actions.wave.setLoop(THREE.LoopRepeat, Infinity);
    actions.wave.clampWhenFinished = false;
    actions.wave.timeScale = 1;
    if (!actions.wave.isRunning()) actions.wave.reset().play();
  }
  actions.walk?.setEffectiveWeight(1 - wave);
  actions.wave?.setEffectiveWeight(wave);
  if (actions.walk) actions.walk.timeScale = 0.9 + run * 0.9;

  mixer.update(dt);
}
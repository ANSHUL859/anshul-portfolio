import * as THREE from 'three';
import { camera, composer, lights } from './scene.js';
import { getShowcaseHandPosition, HOME_GREETING_DURATION, human, updateHuman } from './human.js';
import { mouse, scroll, initUI } from './ui.js';
import { lerp, smoothstep } from './utils.js';
import { updateCodeHologram, updateEnvironment } from './environment.js';

initUI();

const clock = new THREE.Clock();
let phase = 0;
let speed = 1;
let scrollVel = 0;
let lastY = scrollY;
let camAngle = 0;
let homeVisitTime = 0;
const showcaseHandPosition = new THREE.Vector3();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  const isMobile = innerWidth < 800;

  /* Scroll velocity -> run speed */
  const vel = (scrollY - lastY) / Math.max(dt, 0.001);
  lastY = scrollY;
  scrollVel = lerp(scrollVel, Math.abs(vel), 0.1);

  /* Home section par 5 sec idle rehne ke baad animation cycle shuru */
  const isHome = scrollY < innerHeight * 0.35;
  if (isHome) {
    homeVisitTime += dt;
  } else {
    homeVisitTime = 0;
  }

  const wave = smoothstep(0.8, 0.95, scroll.progress);
  const targetSpeed = lerp(1 + Math.min(scrollVel * 0.004, 2.0), 0.4, wave);
  speed = lerp(speed, targetSpeed, 0.06);
  const run = Math.min(Math.max((speed - 0.8) / 2, 0), 1);

  phase += dt * speed * 6;

  /* Update parts */
  updateHuman({
    run,
    wave,
    time,
    homeVisitTime,
    isHome,
    isScrolling: Math.abs(vel) >= 20,
  });

  /* The model faces the camera in its original orientation. */
  human.rotation.y = lerp(human.rotation.y, 0, 0.06);
  human.position.x = lerp(human.position.x, isMobile ? 1.3 : 1.8, 0.05);

  /* Keep the floor shadow aligned with the avatar. */
  updateEnvironment(dt, time, human.position.x, isMobile, scroll.progress);
  const hasShowcaseHandPosition = getShowcaseHandPosition(showcaseHandPosition);
  updateCodeHologram(
    isHome && Math.abs(vel) < 20 && homeVisitTime >= HOME_GREETING_DURATION
      ? homeVisitTime - HOME_GREETING_DURATION
      : null,
    hasShowcaseHandPosition ? showcaseHandPosition : null,
    human.position.x,
    isMobile,
    time
  );

  /* Camera: halka sa side shift, full orbit nahi */
  camAngle = lerp(camAngle, scroll.progress * 0.7, 0.04);
  const R = isMobile ? 6.2 : 4.6;
  const tx = isMobile ? human.position.x - 1.1 : human.position.x * 0.25;
  const camY = (isMobile ? 2.3 : 1.68) + scroll.progress * 0.3;

  camera.position.set(
    tx + Math.sin(camAngle) * R + mouse.x * 0.25,
    camY - mouse.y * 0.15,
    Math.cos(camAngle) * R
  );
  camera.lookAt(tx, isMobile ? 1.8 : 1.43, 0);

  /* Light pulse (subtle) */
  lights.cyan.intensity = 0.5 + Math.sin(time * 2) * 0.06;
  lights.pink.intensity = 0.2 + Math.cos(time * 2) * 0.03;

  composer.render();
  requestAnimationFrame(tick);
}
tick();
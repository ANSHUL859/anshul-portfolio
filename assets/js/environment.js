import * as THREE from 'three';
import { camera, scene } from './scene.js';

const backgroundUrl = new URL(
  '../animation/Modern Sage-Toned Corporate Lobby.png',
  import.meta.url
);
const backgroundTexture = new THREE.TextureLoader().load(
  backgroundUrl.href,
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.center.set(0.5, 0.5);
    texture.needsUpdate = true;
    fitBackground();
    scene.background = texture;
  },
  undefined,
  (error) => console.error('[environment] Background image failed to load:', error)
);

function fitBackground() {
  const image = backgroundTexture.image;
  if (!image?.width || !image?.height) return;

  const imageAspect = image.width / image.height;
  const viewportAspect = innerWidth / innerHeight;
  if (imageAspect > viewportAspect) {
    const visibleWidth = viewportAspect / imageAspect;
    backgroundTexture.repeat.set(visibleWidth, 1);
    backgroundTexture.offset.set((1 - visibleWidth) / 2, 0);
  } else {
    const visibleHeight = imageAspect / viewportAspect;
    backgroundTexture.repeat.set(1, visibleHeight);
    backgroundTexture.offset.set(0, (1 - visibleHeight) / 2);
  }
  backgroundTexture.needsUpdate = true;
}

addEventListener('resize', fitBackground);

const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = shadowCanvas.height = 256;
const context = shadowCanvas.getContext('2d');
const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
gradient.addColorStop(0, 'rgba(38,51,45,0.28)');
gradient.addColorStop(1, 'rgba(38,51,45,0)');
context.fillStyle = gradient;
context.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);

const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
shadowTexture.colorSpace = THREE.SRGBColorSpace;
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(1.7, 0.78),
  new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
  })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.set(0, 0.008, 0.08);
scene.add(shadow);

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function createCodeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const context = canvas.getContext('2d');

  drawRoundedRect(context, 0, 0, 512, 360, 28);
  context.fillStyle = 'rgba(25, 50, 40, 0.82)';
  context.fill();
  context.fillStyle = 'rgba(57, 116, 88, 0.34)';
  drawRoundedRect(context, 0, 0, 512, 76, 28);
  context.fill();
  context.fillRect(0, 48, 512, 28);

  ['#B67C51', '#A9C2B1', '#E8F0EB'].forEach((color, index) => {
    context.beginPath();
    context.fillStyle = color;
    context.arc(34 + index * 30, 38, 8, 0, Math.PI * 2);
    context.fill();
  });

  context.font = '600 20px "JetBrains Mono", monospace';
  context.fillStyle = '#E8F0EB';
  context.fillText('WORKFLOW  /  LIVE', 150, 45);

  const lines = [
    ['const lead = input;', '#E8F0EB'],
    ['if (lead.score > 80) {', '#A9C2B1'],
    ['  automate(lead);', '#D6A27B'],
    ['  sync("CRM");', '#E8F0EB'],
    ['}', '#A9C2B1'],
  ];
  context.font = '600 22px "JetBrains Mono", monospace';
  lines.forEach(([text, color], index) => {
    context.fillStyle = color;
    context.fillText(text, 38, 128 + index * 43);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createCodeGlyph(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.font = '700 84px "JetBrains Mono", monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = color;
  context.shadowBlur = 18;
  context.fillStyle = color;
  context.fillText(text, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const glyph = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  glyph.scale.set(0.42, 0.21, 1);
  return glyph;
}

const codeHologram = new THREE.Group();
codeHologram.visible = false;
scene.add(codeHologram);
let hologramExitStartedAt = null;
const editorModel = new THREE.Group();
codeHologram.add(editorModel);
const magicSparks = Array.from({ length: 5 }, (_, index) => {
  const spark = new THREE.Mesh(
    new THREE.IcosahedronGeometry(index % 2 ? 0.018 : 0.024, 0),
    new THREE.MeshBasicMaterial({ color: index % 2 ? 0xffd2a8 : 0xe8f0eb })
  );
  codeHologram.add(spark);
  return spark;
});

const hologramBack = new THREE.Mesh(
  new THREE.BoxGeometry(1.04, 0.76, 0.045),
  new THREE.MeshPhysicalMaterial({
    color: 0x244236,
    metalness: 0.42,
    roughness: 0.24,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  })
);
editorModel.add(hologramBack);

const codeFace = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 0.72),
  new THREE.MeshBasicMaterial({
    map: createCodeTexture(),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
codeFace.position.z = 0.026;
editorModel.add(codeFace);

const frameMaterial = new THREE.MeshStandardMaterial({
  color: 0xa9c2b1,
  metalness: 0.72,
  roughness: 0.28,
  emissive: 0x244236,
  emissiveIntensity: 0.35,
});
const copperMaterial = new THREE.MeshStandardMaterial({
  color: 0xb67c51,
  metalness: 0.7,
  roughness: 0.28,
  emissive: 0x8e5d3f,
  emissiveIntensity: 0.2,
});

[
  [1.06, 0.018, 0.065, 0, 0.39, 0],
  [1.06, 0.018, 0.065, 0, -0.39, 0],
  [0.018, 0.76, 0.065, -0.53, 0, 0],
  [0.018, 0.76, 0.065, 0.53, 0, 0],
].forEach(([width, height, depth, x, y, z], index) => {
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    index === 0 ? copperMaterial : frameMaterial
  );
  bar.position.set(x, y, z);
  editorModel.add(bar);
});

const connectorMaterial = new THREE.LineBasicMaterial({
  color: 0xa9c2b1,
  transparent: true,
  opacity: 0.72,
});
const connectorPoints = [
  [[-0.5, 0.23, 0.02], [-0.76, 0.4, 0.03]],
  [[0.5, 0.2, 0.02], [0.76, 0.39, 0.03]],
  [[0.5, -0.22, 0.02], [0.78, -0.4, 0.03]],
];
connectorPoints.forEach((points) => {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point))),
    connectorMaterial
  );
  editorModel.add(line);
});

const floatingGlyphs = [
  { object: createCodeGlyph('</>', '#E8F0EB'), x: -0.78, y: 0.4, phase: 0 },
  { object: createCodeGlyph('{ }', '#D6A27B'), x: 0.78, y: -0.4, phase: 1.8 },
];
floatingGlyphs.forEach(({ object, x, y }) => {
  object.position.set(x, y, 0.09);
  editorModel.add(object);
});

const codeCube = new THREE.Mesh(
  new THREE.BoxGeometry(0.09, 0.09, 0.09),
  new THREE.MeshStandardMaterial({
    color: 0xb67c51,
    metalness: 0.65,
    roughness: 0.26,
    wireframe: true,
  })
);
codeCube.position.set(0.72, 0.42, 0.12);
editorModel.add(codeCube);

const codeNode = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.035, 1),
  new THREE.MeshStandardMaterial({
    color: 0xa9c2b1,
    emissive: 0x397458,
    emissiveIntensity: 0.65,
    roughness: 0.25,
  })
);
codeNode.position.set(-0.74, -0.4, 0.12);
editorModel.add(codeNode);

function addHologramLine(group, points, color) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point))),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.78 })
  );
  group.add(line);
  return line;
}

const workflowModel = new THREE.Group();
const workflowPoints = [
  [-0.38, 0, 0.04],
  [-0.08, 0.2, 0.04],
  [0.28, 0.16, 0.04],
  [0.4, -0.16, 0.04],
  [0.04, -0.22, 0.04],
  [-0.38, 0, 0.04],
];
for (let index = 0; index < workflowPoints.length - 1; index += 1) {
  addHologramLine(workflowModel, [workflowPoints[index], workflowPoints[index + 1]], 0xa9c2b1);
}
workflowPoints.slice(0, -1).forEach((point, index) => {
  const node = new THREE.Mesh(
    index === 2 ? new THREE.IcosahedronGeometry(0.105, 0) : new THREE.SphereGeometry(0.075, 20, 16),
    new THREE.MeshStandardMaterial({
      color: index % 2 ? 0xb67c51 : 0xa9c2b1,
      emissive: index % 2 ? 0x70472e : 0x244236,
      emissiveIntensity: 0.55,
      metalness: 0.45,
      roughness: 0.28,
    })
  );
  node.position.set(...point);
  workflowModel.add(node);
});
const workflowPath = new THREE.CatmullRomCurve3(
  workflowPoints.map((point) => new THREE.Vector3(...point)),
  false,
  'catmullrom',
  0.2
);
const workflowPulse = new THREE.Mesh(
  new THREE.SphereGeometry(0.035, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0xffd2a8 })
);
workflowModel.add(workflowPulse);
codeHologram.add(workflowModel);

const databaseModel = new THREE.Group();
const databaseMaterial = new THREE.MeshStandardMaterial({
  color: 0x397458,
  emissive: 0x244236,
  emissiveIntensity: 0.45,
  metalness: 0.55,
  roughness: 0.25,
});
[-0.29, 0, 0.29].forEach((y, index) => {
  const disk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.08, 32),
    index === 2 ? copperMaterial : databaseMaterial
  );
  disk.rotation.x = Math.PI / 2;
  disk.position.y = y;
  databaseModel.add(disk);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.012, 8, 32),
    frameMaterial
  );
  rim.position.set(0, y, 0.055);
  databaseModel.add(rim);
});
const databaseSatellite = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.055, 1),
  copperMaterial
);
databaseModel.add(databaseSatellite);
codeHologram.add(databaseModel);

const analyticsModel = new THREE.Group();
const chartHeights = [0.2, 0.34, 0.47, 0.62];
const chartPoints = chartHeights.map((height, index) => [
  -0.3 + index * 0.2,
  -0.25 + height,
  0.05,
]);
chartHeights.forEach((height, index) => {
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, height, 0.09),
    index === chartHeights.length - 1 ? copperMaterial : frameMaterial
  );
  bar.position.set(-0.3 + index * 0.2, -0.25 + height / 2, 0.04);
  analyticsModel.add(bar);
  const point = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xe8f0eb })
  );
  point.position.set(...chartPoints[index]);
  analyticsModel.add(point);
});
addHologramLine(analyticsModel, chartPoints, 0xe8f0eb);
addHologramLine(analyticsModel, [[-0.42, -0.27, 0.04], [0.42, -0.27, 0.04]], 0xa9c2b1);
codeHologram.add(analyticsModel);

const hologramModels = [editorModel, workflowModel, databaseModel, analyticsModel];
const hologramModelInterval = 4;
const hologramModelTransition = 0.55;

function updateHologramModel(showcaseTime, time) {
  const modelIndex = Math.floor(showcaseTime / hologramModelInterval) % hologramModels.length;
  const nextIndex = (modelIndex + 1) % hologramModels.length;
  const intervalTime = showcaseTime % hologramModelInterval;
  const transition = THREE.MathUtils.smoothstep(
    intervalTime,
    hologramModelInterval - hologramModelTransition,
    hologramModelInterval
  );

  hologramModels.forEach((model, index) => {
    const modelScale = index === modelIndex
      ? 1 - transition
      : index === nextIndex
        ? transition
        : 0;
    model.visible = modelScale > 0.001;
    model.scale.setScalar(modelScale * 0.68);
  });

  workflowPulse.position.copy(workflowPath.getPoint((time * 0.22) % 1));
  databaseSatellite.position.set(
    Math.cos(time * 1.4) * 0.32,
    Math.sin(time * 1.4) * 0.3,
    0.12
  );
}

export function updateEnvironment(_dt, _time, humanX = 0, isMobile = false) {
  shadow.position.x = humanX;
  shadow.scale.setScalar(isMobile ? 0.8 : 1);
}

export function updateCodeHologram(
  showcaseTime,
  handPosition,
  humanX = 0,
  isMobile = false,
  time = 0
) {
  const exiting = showcaseTime === null;
  if (exiting) {
    if (!codeHologram.visible) return;
    if (hologramExitStartedAt === null) hologramExitStartedAt = time;
  } else {
    hologramExitStartedAt = null;
    codeHologram.visible = true;
  }

  const exitElapsed = exiting ? time - hologramExitStartedAt : 0;
  if (exiting && exitElapsed >= 0.35) {
    codeHologram.visible = false;
    hologramExitStartedAt = null;
    return;
  }
  const animationTime = showcaseTime === null ? 1.25 : showcaseTime;
  const rise = THREE.MathUtils.smoothstep(animationTime, 0.08, 1.25);
  const fade = exiting
    ? 1 - THREE.MathUtils.smoothstep(exitElapsed, 0, 0.35)
    : THREE.MathUtils.smoothstep(showcaseTime, 0.05, 0.6);
  if (!exiting) updateHologramModel(showcaseTime, time);
  codeHologram.position.set(
    handPosition
      ? handPosition.x - 0.3 * rise
      : humanX + (isMobile ? 0.4 : 0.72) * rise,
    handPosition
      ? handPosition.y + 0.05 + 0.3 * rise + Math.sin(time * 1.8) * 0.035
      : 1.12 + 0.9 * rise + Math.sin(time * 1.8) * 0.035,
    handPosition ? handPosition.z + 0.12 : 0.2
  );
  codeHologram.quaternion.copy(camera.quaternion);
  codeHologram.rotateZ(Math.sin(time * 0.7) * 0.018);
  codeHologram.scale.setScalar(fade);

  magicSparks.forEach((spark, index) => {
    const phase = time * 2.8 + index * (Math.PI * 2 / magicSparks.length);
    spark.position.set(
      0.3 + Math.cos(phase) * 0.06,
      -0.35 + ((time * 0.18 + index * 0.07) % 0.3),
      0.16 + Math.sin(phase) * 0.04
    );
    spark.scale.setScalar(fade * (0.6 + Math.sin(phase * 1.4) * 0.35));
  });

  floatingGlyphs.forEach(({ object, y, phase }) => {
    object.position.y = y + Math.sin(time * 1.5 + phase) * 0.045;
    object.material.opacity = fade;
  });
  codeCube.rotation.set(time * 0.42, time * 0.6, time * 0.35);
  codeNode.scale.setScalar(0.85 + Math.sin(time * 2.2) * 0.12);
}

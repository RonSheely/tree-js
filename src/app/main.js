import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Tree, TreePreset } from '@dgreenheck/ez-tree';
import { setupUI } from './ui';
import { Environment } from './environment';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 2;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x94b9f8, 0.0015);

const environment = new Environment();
scene.add(environment);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000,
);
camera.position.set(100, 20, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 3;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 10;
controls.maxDistance = 150;
controls.target.set(0, 25, 0);
controls.update();

const tree = new Tree();
tree.loadPreset('Ash Medium');
tree.generate();
tree.castShadow = true;
tree.receiveShadow = true;
scene.add(tree);

for (let i = 0; i < 100; i++) {
  const r = 200 + Math.random() * 500;
  const theta = 2 * Math.PI * Math.random();
  const presets = Object.keys(TreePreset);
  const index = Math.floor(Math.random() * presets.length);

  const t = new Tree();
  t.position.set(r * Math.cos(theta), 0, r * Math.sin(theta));
  t.loadPreset(presets[index]);
  t.options.seed = 10000 * Math.random();
  t.generate();
  t.castShadow = true;
  t.receiveShadow = true;
  scene.add(t);
}

// Read tree parameters from JSON
document
  .getElementById('fileInput')
  .addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          tree.options = JSON.parse(e.target.result);
          tree.generate();
          setupUI(tree, renderer, scene, camera);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.onerror = function (e) {
        console.error('Error reading file:', e);
      };
      reader.readAsText(file);
    }
  });

// Resize camera aspect ratio and renderer size to the new window size

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Post-processing setup
const composer = new EffectComposer(renderer);

// Render pass: Renders the scene normally as the first pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
composer.addPass(smaaPass);
// God rays pass: (Optional, requires additional setup for light shafts if needed)
// Add your custom god rays pass here if you have implemented it

const outputPass = new OutputPass();
composer.addPass(outputPass);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  environment.update(clock.getElapsedTime());
  controls.update();
  composer.render();
}

setupUI(tree, environment, renderer, scene, camera, 'Ash Medium');
animate();

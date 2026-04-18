import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const container = document.getElementById('globe-container');
if (!container) {
  console.warn('No globe container found');
} else {
  // ── Setup ──────────────────────────────────────────
  let W = container.clientWidth;
  let H = container.clientHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  camera.position.set(0, 3, 16);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // Transparent background
  container.appendChild(renderer.domElement);

  // ── Interactions & Post Processing ──────────────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 25;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;

  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.2;
  bloomPass.strength = 1.2; // Neon glow strength
  bloomPass.radius = 0.5;

  const composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  // ── Lights ─────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x3b82f6, 3, 50);
  pointLight.position.set(-10, -10, 10);
  scene.add(pointLight);

  // ── Smooth Aurora Background ────────────────────────
  // We use a massive sphere inside the scene to paint the background
  // because UnrealBloomPass overrides CSS transparency.
  const bgGeometry = new THREE.SphereGeometry(150, 32, 32);
  const bgMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      void main() {
        vec3 pos = normalize(vPosition);
        
        // 3 floating light blobs for an aurora mesh gradient feel
        float blob1 = max(0.0, dot(pos, normalize(vec3(-1.0, 1.0, -0.5))));
        float blob2 = max(0.0, dot(pos, normalize(vec3(1.0, -1.0, -0.5))));
        float blob3 = max(0.0, dot(pos, normalize(vec3(0.0, 0.0, 1.0))));
        
        vec3 col1 = vec3(0.14, 0.38, 0.92) * pow(blob1, 1.5); // Rich blue
        vec3 col2 = vec3(0.48, 0.22, 0.92) * pow(blob2, 1.5); // Deep purple
        vec3 col3 = vec3(0.05, 0.64, 0.91) * pow(blob3, 1.5); // Cyan
        
        vec3 base = vec3(0.04, 0.06, 0.12); // Deep midnight base
        
        // Output final color (kept perfectly dark enough to not trigger bloom)
        gl_FragColor = vec4(base + col1*0.35 + col2*0.35 + col3*0.15, 1.0);
      }
    `
  });
  const backgroundSphere = new THREE.Mesh(bgGeometry, bgMaterial);
  scene.add(backgroundSphere);

  // ── Globe Core ──────────────────────────────────────
  const GLOBE_RADIUS = 5;

  // Solid Core
  const coreGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a, // Deep slate
    emissive: 0x020617,
    roughness: 0.1,
    metalness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(core);

  // Hex / Wireframe layer
  const wireGeometry = new THREE.WireframeGeometry(new THREE.SphereGeometry(GLOBE_RADIUS + 0.02, 32, 32));
  const wireMaterial = new THREE.LineBasicMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });
  const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
  core.add(wireframe);

  // Atmospheric Glow (Custom Shader)
  const atmosGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.3, 64, 64);
  const atmosMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
        gl_FragColor = vec4(0.14, 0.38, 0.92, 1.0) * intensity * 1.5;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
  scene.add(atmosphere);

  // ── Constellations / Points ─────────────────────────
  const numParticles = 2000;
  const posArray = new Float32Array(numParticles * 3);
  for(let i=0; i<numParticles*3; i++) {
    posArray[i] = (Math.random() - 0.5) * 35;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
  });
  const particlesMesh = new THREE.Points(particleGeo, particleMat);
  scene.add(particlesMesh);

  // ── Flight Paths ────────────────────────────────────
  function latLonToVec3(lat, lon, radius = GLOBE_RADIUS) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
       radius * Math.cos(phi),
       radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  const cities = [
    { name: 'Toronto',  lat: 43.65, lon: -79.35 },
    { name: 'Montreal', lat: 45.50, lon: -73.57 },
    { name: 'New York', lat: 40.71, lon: -74.01 },
    { name: 'Chicago',  lat: 41.88, lon: -87.63 },
    { name: 'London',   lat: 51.51, lon: -0.13 },
    { name: 'Edinburgh',lat: 55.95, lon: -3.19 },
    { name: 'Paris',    lat: 48.86, lon: 2.35 },
    { name: 'Nice',     lat: 43.71, lon: 7.26 },
    { name: 'Bonn',     lat: 50.74, lon: 7.10 },
    { name: 'Berlin',   lat: 52.52, lon: 13.40 },
    { name: 'Rome',     lat: 41.90, lon: 12.50 },
    { name: 'Naples',   lat: 40.85, lon: 14.27 },
    { name: 'Dubai',    lat: 25.20, lon: 55.27 },
    { name: 'Tokyo',    lat: 35.67, lon: 139.65 },
    { name: 'Singapore',lat: 1.35,  lon: 103.81},
    { name: 'Sydney',   lat: -33.86,lon: 151.20 }
  ];

  // City Markers
  const markerGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pulseGeo = new THREE.RingGeometry(0.08, 0.16, 32);
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, side: THREE.DoubleSide });

  const pts = cities.map(c => {
    const pos = latLonToVec3(c.lat, c.lon, GLOBE_RADIUS + 0.02);
    
    // Dot
    const m = new THREE.Mesh(markerGeo, markerMat);
    m.position.copy(pos);
    scene.add(m);

    // Pulse Ring
    const ring = new THREE.Mesh(pulseGeo, pulseMat);
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(ring);
    
    return pos;
  });

  // Dynamic Arcs (Tubes)
  const paths = [
    [pts[0], pts[2]], [pts[2], pts[4]], [pts[4], pts[6]],
    [pts[6], pts[10]], [pts[1], pts[9]], [pts[3], pts[4]],
    [pts[5], pts[8]], [pts[11], pts[7]], [pts[4], pts[12]],
    [pts[12], pts[14]], [pts[14], pts[15]], [pts[12], pts[13]],
    [pts[3], pts[13]], [pts[0], pts[4]], [pts[2], pts[12]]
  ];

  const animatedPaths = [];

  paths.forEach(([start, end]) => {
    // Math to curve the arc outwards based on distance
    const distance = start.distanceTo(end);
    const midPoint = start.clone().lerp(end, 0.5);
    const curveHeight = distance * 0.25; 
    midPoint.normalize().multiplyScalar(GLOBE_RADIUS + curveHeight);

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    
    // Tube Geometry for the arc so it looks 3D and catches Bloom
    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.015, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({ 
      color: 0x1d4ed8, 
      transparent: true, 
      opacity: 0.2,
      blending: THREE.AdditiveBlending 
    });
    scene.add(new THREE.Mesh(tubeGeo, tubeMat));

    // Moving "Plane" (Bright glowing sphere moving along the curve)
    const planeGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const planeMat = new THREE.MeshBasicMaterial({ 
      color: 0x38bdf8, // Bright cyan
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    
    // Point light to create an intense moving glow
    const planeLight = new THREE.PointLight(0x38bdf8, 1.5, 2);
    planeMesh.add(planeLight);

    scene.add(planeMesh);

    animatedPaths.push({
      curve: curve,
      mesh: planeMesh,
      progress: Math.random(),
      speed: 0.001 + (Math.random() * 0.0015)
    });
  });

  // Mouse interactivity targeting
  const mouse = new THREE.Vector2();
  const targetRotation = new THREE.Vector2();
  
  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouse.set(x, y);
    
    // Slight tilt to the globe based on mouse
    targetRotation.x = mouse.y * 0.2;
    targetRotation.y = mouse.x * 0.2;
  });

  // ── Animation Loop ──────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    // Orbit controls
    controls.update();

    // Pulse rings
    scene.children.forEach(child => {
      if (child.geometry instanceof THREE.RingGeometry) {
        const scale = 1 + Math.sin(time * 3 + child.position.x) * 0.2;
        child.scale.set(scale, scale, 1);
        child.material.opacity = 0.4 + Math.sin(time * 3 + child.position.x) * 0.2;
      }
    });

    // Particle background slow rotation
    particlesMesh.rotation.y = time * 0.02;
    particlesMesh.rotation.x = time * 0.01;

    // Interactive Core Tilt Effect
    core.rotation.x += (targetRotation.x - core.rotation.x) * 0.05;
    core.rotation.y += (targetRotation.y - core.rotation.y) * 0.05;
    atmosphere.rotation.x = core.rotation.x;
    atmosphere.rotation.y = core.rotation.y;

    // Animate airplanes (moving dots along beziers)
    animatedPaths.forEach(ap => {
      ap.progress += ap.speed;
      if (ap.progress > 1) {
        ap.progress = 0;
      }
      const position = ap.curve.getPointAt(ap.progress);
      ap.mesh.position.copy(position);

      // Make lines fade out at ends
      const distFromEnd = Math.min(ap.progress, 1.0 - ap.progress);
      ap.mesh.scale.setScalar(Math.min(distFromEnd * 4, 1.5));
    });

    // Render with Bloom
    composer.render();
  }

  animate();

  // ── Resize Handler ──────────────────────────────────
  window.addEventListener('resize', () => {
    W = container.clientWidth;
    H = container.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    composer.setSize(W, H);
  });
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup Scene, Camera, Renderer
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 15;
camera.position.y = 5;

// Renderer setup with modern clear colors
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Transparent background to let the CSS gradient show
renderer.setClearColor(0x000000, 0); 
container.appendChild(renderer.domElement);

// Orbit Controls for interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 25;

// Global Illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// The Main Globe
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);

// We will use a clean, modern material
const globeMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.9,
    shininess: 50,
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Wireframe layer for the tech/modern feel
const wireframeGeometry = new THREE.WireframeGeometry(new THREE.SphereGeometry(5.01, 32, 32));
const wireframeMaterial = new THREE.LineBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.15
});
const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
globe.add(wireframe);

// Function to convert lat/lon to 3D Cartesian coordinates
function latLongToVector3(lat, lon, radius) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);

    var x = -(radius * Math.sin(phi) * Math.cos(theta));
    var z = (radius * Math.sin(phi) * Math.sin(theta));
    var y = (radius * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
}

// Add markers for the 12 Cities from the Case Study
const cities = [
    { name: 'Toronto', lat: 43.651070, lon: -79.347015 },
    { name: 'Montreal', lat: 45.501690, lon: -73.567253 },
    { name: 'New York', lat: 40.712776, lon: -74.005974 },
    { name: 'Chicago', lat: 41.878113, lon: -87.629799 },
    { name: 'London', lat: 51.507351, lon: -0.127758 },
    { name: 'Edinburgh', lat: 55.953251, lon: -3.188267 },
    { name: 'Paris', lat: 48.856613, lon: 2.352222 },
    { name: 'Nice', lat: 43.710175, lon: 7.261953 },
    { name: 'Bonn', lat: 50.7374, lon: 7.0982 },
    { name: 'Berlin', lat: 52.520008, lon: 13.404954 },
    { name: 'Rome', lat: 41.902782, lon: 12.496366 },
    { name: 'Naples', lat: 40.851775, lon: 14.268124 }
];

const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 });

const cityPoints = [];

cities.forEach(city => {
    const position = latLongToVector3(city.lat, city.lon, 5.05);
    cityPoints.push(position);
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    
    // Add pulsing effect
    const pulseGeometry = new THREE.RingGeometry(0.12, 0.18, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xef4444, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(position);
    pulse.lookAt(new THREE.Vector3(0, 0, 0)); // Face outwards from sphere
    
    scene.add(marker);
    scene.add(pulse);
});

// Create curved flight paths (Arcs) between a few random cities
const flightPathMaterial = new THREE.LineBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.6,
    linewidth: 2
});

function createFlightPath(startPoint, endPoint) {
    const distance = startPoint.distanceTo(endPoint);
    const midPoint = startPoint.clone().lerp(endPoint, 0.5);
    
    // Push midpoint out to create an arc
    midPoint.normalize();
    midPoint.multiplyScalar(5.05 + distance * 0.2); 

    const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, flightPathMaterial);
}

// Draw a few sample flight paths
scene.add(createFlightPath(cityPoints[0], cityPoints[2])); // Toronto > NY
scene.add(createFlightPath(cityPoints[2], cityPoints[4])); // NY > London
scene.add(createFlightPath(cityPoints[4], cityPoints[6])); // London > Paris
scene.add(createFlightPath(cityPoints[6], cityPoints[10])); // Paris > Rome
scene.add(createFlightPath(cityPoints[10], cityPoints[0])); // Rome > Toronto
scene.add(createFlightPath(cityPoints[1], cityPoints[9])); // Montreal > Berlin


// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Auto rotate the globe slowly
    globe.rotation.y += 0.001;
    scene.children.forEach(child => {
        if(child.type === "Line" || child.geometry?.type === "SphereGeometry" || child.geometry?.type === "RingGeometry") {
            if(child !== globe && child.parent !== globe) {
                 // We don't rotate markers directly here; grouping them to a Pivot object is better
                 // For now, let the user manually spin the globe with OrbitControls
            }
        }
    });
    
    // Instead of complex rotations, we rotate the whole scene slightly
    scene.rotation.y += 0.001;

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle Window Resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

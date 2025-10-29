import * as THREE from "three"; // import Three.js

// Scene setup
const scene = new THREE.Scene(); // Establish the scene
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("canvas.webgl"),
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight); // Setting size to device screen size
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance

// Create circle texture
const particleTexture = (() => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const size = 32;
  canvas.width = size;
  canvas.height = size;

  // Draw white circle with soft edges
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
})();

// Particles
const particlesGeometry = new THREE.BufferGeometry(); // Geometry to hold all particles
const count = 500; // Total particle count

const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const sizes = new Float32Array(count);
const twinkleSpeed = new Float32Array(count);

// Define colors
const white = new THREE.Color(0xffffff);
const gold = new THREE.Color(0xffd700);

for (let i = 0; i < count; i++) {
  const i3 = i * 3;
  // Position
  positions[i3] = (Math.random() - 0.5) * 15;
  positions[i3 + 1] = (Math.random() - 0.5) * 15;
  positions[i3 + 2] = (Math.random() - 0.5) * 15;

  // Color
  const color = Math.random() > 0.5 ? white : gold;
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;

  // Size and twinkle speed
  sizes[i] = 0.5 + Math.random() * 0.5;
  twinkleSpeed[i] = 0.5 + Math.random() * 2;
}

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
particlesGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

// Simplified particle material without custom shaders
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.03,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  map: particleTexture,
  alphaTest: 0.01,
  sizeAttenuation: true,
  blending: THREE.AdditiveBlending,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// ShootingStar class - Fixed version with random directions
class ShootingStar {
  constructor() {
    this.trailLength = 100; // Much longer trail

    // Use points instead of line for better trail rendering
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.trailLength * 3);
    const colors = new Float32Array(this.trailLength * 3);
    const sizes = new Float32Array(this.trailLength);

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Use Points for trail to have better control over opacity
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: particleTexture,
    });

    this.trail = new THREE.Points(geometry, material);

    // Create the bright head of the shooting star
    const headGeometry = new THREE.SphereGeometry(0.08, 12, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      emissive: 0xffffff,
      emissiveIntensity: 3,
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);

    // Add glow effect to head
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff69b4,
      transparent: true,
      opacity: 0.3,
      emissive: 0xff69b4,
      emissiveIntensity: 1,
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);

    // Group for trail, head, and glow
    this.group = new THREE.Group();
    this.group.add(this.trail);
    this.group.add(this.head);
    this.group.add(this.glow);

    this.trailPositions = [];
    this.reset();
  }

  reset() {
    // Determine movement type: 0 = across screen, 1 = into screen, 2 = out of screen
    const movementType = Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 2;

    if (movementType === 0) {
      // Original behavior - moving across the screen
      const edge = Math.floor(Math.random() * 4);
      const margin = 18;
      const spread = 10;

      switch (edge) {
        case 0: // Top edge
          this.position = new THREE.Vector3(
            (Math.random() - 0.5) * spread * 2,
            margin,
            -5 + Math.random() * 10
          );
          break;
        case 1: // Right edge
          this.position = new THREE.Vector3(
            margin,
            (Math.random() - 0.5) * spread * 2,
            -5 + Math.random() * 10
          );
          break;
        case 2: // Bottom edge
          this.position = new THREE.Vector3(
            (Math.random() - 0.5) * spread * 2,
            -margin,
            -5 + Math.random() * 10
          );
          break;
        case 3: // Left edge
          this.position = new THREE.Vector3(
            -margin,
            (Math.random() - 0.5) * spread * 2,
            -5 + Math.random() * 10
          );
          break;
      }

      // Create velocity pointing across the scene
      const speed = 0.2 + Math.random() * 0.15;
      const targetX = -this.position.x * 0.8 + (Math.random() - 0.5) * 10;
      const targetY = -this.position.y * 0.8 + (Math.random() - 0.5) * 10;

      // Normalize direction
      const direction = new THREE.Vector3(targetX, targetY, 0).normalize();

      this.velocity = new THREE.Vector3(
        direction.x * speed,
        direction.y * speed,
        (Math.random() - 0.5) * speed * 0.2 // Small z movement
      );
    } else if (movementType === 1) {
      // Moving INTO the screen (away from viewer)
      this.position = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        10 + Math.random() * 5 // Start close to camera
      );

      const speed = 0.3 + Math.random() * 0.2;
      this.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed * 0.3, // Small x drift
        (Math.random() - 0.5) * speed * 0.3, // Small y drift
        -speed * 2 // Strong movement away from camera
      );

      this.perspectiveScale = true;
      this.baseSize = 1.5; // Start larger when close
    } else {
      // Moving OUT of the screen (toward viewer)
      this.position = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        -20 - Math.random() * 10 // Start far from camera
      );

      const speed = 0.3 + Math.random() * 0.2;
      this.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed * 0.2, // Small x drift
        (Math.random() - 0.5) * speed * 0.2, // Small y drift
        speed * 2.5 // Strong movement toward camera
      );

      this.perspectiveScale = true;
      this.baseSize = 0.3; // Start smaller when far
    }

    this.movementType = movementType;

    // Clear trail positions
    this.trailPositions = [];
    for (let i = 0; i < this.trailLength; i++) {
      this.trailPositions.push(this.position.clone());
    }

    // Choose random color scheme
    const colorSchemes = [
      { head: 0xffffff, trail: 0xffffff }, // White trail
      { head: 0xffffff, trail: 0xff69b4 }, // Pink trail
      { head: 0xffffff, trail: 0x87ceeb }, // Blue trail
      { head: 0xffffff, trail: 0xffd700 }, // Gold trail
    ];

    const scheme =
      colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    this.trailColor = new THREE.Color(scheme.trail);
    this.head.material.color.setHex(scheme.head);

    // Randomize delay before next appearance
    this.delay = 50 + Math.random() * 300;
    this.alive = false;
    this.fadeIn = 0;
    this.group.visible = false;
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }

    if (!this.alive) {
      this.alive = true;
      this.group.visible = true;
      this.fadeIn = 0;
    }

    // Fade in effect
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + 0.08);
    }

    // Update position
    this.position.add(this.velocity);

    // Update head and glow position
    this.head.position.copy(this.position);
    this.glow.position.copy(this.position);

    // Update trail positions array
    this.trailPositions.unshift(this.position.clone());
    if (this.trailPositions.length > this.trailLength) {
      this.trailPositions.pop();
    }

    // Update trail geometry
    const positions = this.trail.geometry.attributes.position.array;
    const colors = this.trail.geometry.attributes.color.array;
    const sizes = this.trail.geometry.attributes.size.array;

    for (let i = 0; i < this.trailLength; i++) {
      const i3 = i * 3;

      if (i < this.trailPositions.length) {
        positions[i3] = this.trailPositions[i].x;
        positions[i3 + 1] = this.trailPositions[i].y;
        positions[i3 + 2] = this.trailPositions[i].z;

        // Fade out trail - more visible tail
        const fade = Math.pow(1 - i / this.trailLength, 0.001) * this.fadeIn;

        // Color with fade
        colors[i3] = this.trailColor.r * fade;
        colors[i3 + 1] = this.trailColor.g * fade;
        colors[i3 + 2] = this.trailColor.b * fade;

        // Size decreases along trail
        let sizeMultiplier = 2;

        // Adjust size based on Z position for depth effect
        if (this.perspectiveScale) {
          const distanceFromCamera = Math.abs(this.trailPositions[i].z - 5);
          sizeMultiplier =
            this.baseSize * (1 / (1 + distanceFromCamera * 0.05));
        }

        sizes[i] =
          (1 - i / this.trailLength) * 2 * this.fadeIn * sizeMultiplier;
      } else {
        // Hide unused trail points
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = -100;
        sizes[i] = 0;
      }
    }

    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;
    this.trail.geometry.attributes.size.needsUpdate = true;

    // Update head and glow opacity and size
    this.head.material.opacity = this.fadeIn;
    this.glow.material.opacity = this.fadeIn * 0.3;

    // Scale head based on Z position for depth effect
    if (this.perspectiveScale) {
      const distanceFromCamera = Math.abs(this.position.z - 5);
      const scale = this.baseSize * (1 / (1 + distanceFromCamera * 0.05));
      this.head.scale.setScalar(scale);
      this.glow.scale.setScalar(scale * 1.5);
    }

    // Reset if out of bounds
    const bound = 20;
    const zBound = 25;
    if (
      Math.abs(this.position.x) > bound ||
      Math.abs(this.position.y) > bound ||
      this.position.z > zBound ||
      this.position.z < -zBound
    ) {
      this.reset();
    }
  }
}

// Create shooting stars
const shootingStars = [];
const numShootingStars = 2; // Increased for more variety with 3D movement

for (let i = 0; i < numShootingStars; i++) {
  const star = new ShootingStar();
  // Stagger initial delays more
  star.delay = i * 80 + Math.random() * 400;
  shootingStars.push(star);
  scene.add(star.group);
}

// Camera position
camera.position.z = 5;

// Clock for consistent animation
const clock = new THREE.Clock();

// Animation
function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Update particle sizes for twinkling effect
  const sizes = particlesGeometry.attributes.aSize.array;
  for (let i = 0; i < count; i++) {
    const originalSize = 0.5 + (i % 10) * 0.05;
    sizes[i] = originalSize + 0.3 * Math.sin(elapsedTime * twinkleSpeed[i]);
  }
  particlesGeometry.attributes.aSize.needsUpdate = true;

  // Gentle rotation
  particles.rotation.x += 0.0002;
  particles.rotation.y += 0.0003;

  // Update shooting stars
  shootingStars.forEach((star) => star.update());

  renderer.render(scene, camera);
}

animate();

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

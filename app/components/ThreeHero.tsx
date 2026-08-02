"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05090e, 0.036);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 4.5, 13);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const iceMaterial = new THREE.MeshStandardMaterial({
      color: 0x79b8c6,
      metalness: 0.45,
      roughness: 0.3,
      emissive: 0x0a3340,
      emissiveIntensity: 0.55,
      wireframe: true,
      transparent: true,
      opacity: 0.72,
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 2), iceMaterial);
    core.rotation.z = 0.22;
    group.add(core);

    const rings: THREE.Mesh[] = [];
    [3.3, 4.35, 5.35].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index === 0 ? 0.025 : 0.012, 8, 180),
        new THREE.MeshBasicMaterial({ color: index === 0 ? 0xd8a65d : 0x40798a, transparent: true, opacity: 0.5 }),
      );
      ring.rotation.x = Math.PI / (2.4 + index * 0.4);
      ring.rotation.y = index * 0.72;
      rings.push(ring);
      group.add(ring);
    });

    const particleCount = 640;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 4 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = Math.sin(theta) * radius - 3;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particlesGeometry,
      new THREE.PointsMaterial({ color: 0xd9edf0, size: 0.025, transparent: true, opacity: 0.65 }),
    );
    scene.add(particles);

    const light = new THREE.PointLight(0xc5f4ff, 24, 30);
    light.position.set(2, 5, 7);
    scene.add(light, new THREE.AmbientLight(0x385f69, 1.3));

    let pointerX = 0;
    let pointerY = 0;
    const onPointer = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.4;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.22;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let animation = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      core.rotation.y = t * 0.08 + pointerX;
      core.rotation.x = Math.sin(t * 0.28) * 0.08 - pointerY;
      rings.forEach((ring, index) => { ring.rotation.z = t * (0.035 + index * 0.016) * (index % 2 ? -1 : 1); });
      particles.rotation.y = t * 0.006;
      group.position.y = Math.sin(t * 0.55) * 0.12;
      renderer.render(scene, camera);
      animation = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("pointermove", onPointer);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="three-hero" ref={mountRef} aria-hidden="true" />;
}

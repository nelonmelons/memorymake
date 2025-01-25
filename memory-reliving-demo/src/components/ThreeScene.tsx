import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import styled from '@emotion/styled';

const Canvas = styled.div`
  width: 800px;
  height: 600px;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;

  :fullscreen {
    width: 100vw;
    height: 100vh;
  }
`;

interface ThreeSceneProps {
  objUrl?: string;
  onLoadProgress?: (progress: number) => void;
  onLoadError?: (error: string) => void;
  onLoadComplete?: () => void;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
  objUrl,
  onLoadProgress,
  onLoadError,
  onLoadComplete
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const labelRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      800 / 600,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.setClearColor(0x1e1e1e);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Add placeholder geometry
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.5,
      roughness: 0.5,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    modelRef.current = cube;

    // Add text label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = '#ffffff';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText('3D scene goes here', 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(4, 2);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 3, 0);
    scene.add(label);
    labelRef.current = label;

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current && renderer && camera) {
        const container = canvasRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (modelRef.current && !objUrl) {
        modelRef.current.rotation.x += 0.01;
        modelRef.current.rotation.y += 0.01;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      labelGeometry.dispose();
      labelMaterial.dispose();
      texture.dispose();
      canvasRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Handle OBJ loading
  useEffect(() => {
    if (!objUrl || !sceneRef.current) return;

    const loader = new OBJLoader();
    
    loader.load(
      objUrl,
      (object) => {
        if (sceneRef.current && modelRef.current && labelRef.current) {
          // Remove previous model and label
          sceneRef.current.remove(modelRef.current);
          sceneRef.current.remove(labelRef.current);
          
          // Center and scale the loaded object
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          
          object.position.sub(center);
          object.scale.multiplyScalar(scale);
          
          // Add to scene and store reference
          sceneRef.current.add(object);
          modelRef.current = object;
          
          // Notify completion
          onLoadComplete?.();
        }
      },
      (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
        onLoadProgress?.(progress);
      },
      (error) => {
        console.error('Error loading OBJ:', error);
        onLoadError?.(error.message || 'Failed to load model');
      }
    );
  }, [objUrl, onLoadComplete, onLoadProgress, onLoadError]);

  return <Canvas ref={canvasRef} />;
};

export default ThreeScene; 
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import styled from '@emotion/styled';

const Canvas = styled.div`
  width: 100%;
  height: 600px;
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);

  canvas {
    width: 100% !important;
    height: 100% !important;
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
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const modelRef = useRef<THREE.Object3D>();
  const animationFrameRef = useRef<number>();
  const loadingRef = useRef<boolean>(false);
  const currentUrlRef = useRef<string>('');

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setClearColor(0x1a1a1a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.8;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Simple lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load model immediately
    if (objUrl) {
      const loader = new OBJLoader();
      const modelPath = objUrl.startsWith('/') ? objUrl : `/${objUrl}`;
      
      loader.load(
        modelPath,
        (object) => {
          if (sceneRef.current && cameraRef.current) {
            // Center and scale the loaded object
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            
            object.position.set(0, 0, 0);
            object.position.sub(center);
            object.scale.multiplyScalar(scale);

            // Add basic material
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                // Keep original material if it exists
                if (!child.material) {
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,  // White base color to show texture colors accurately
                    metalness: 0.0,   // No metallic effect
                    roughness: 0.5,   // Medium roughness
                  });
                }
              }
            });
            
            sceneRef.current.add(object);
            modelRef.current = object;
            onLoadComplete?.();
          }
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress = Math.min((xhr.loaded / xhr.total) * 100, 100);
            onLoadProgress?.(progress);
          }
        },
        (error) => {
          console.error('Error loading model:', error);
          onLoadError?.(error.message || 'Failed to load model');
        }
      );
    }

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height, false);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.domElement.remove();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (modelRef.current instanceof THREE.Mesh) {
        if (modelRef.current.geometry) {
          modelRef.current.geometry.dispose();
        }
        if (Array.isArray(modelRef.current.material)) {
          modelRef.current.material.forEach(mat => mat.dispose());
        } else if (modelRef.current.material) {
          modelRef.current.material.dispose();
        }
      }
    };
  }, []);

  return <Canvas ref={canvasRef} />;
};

export default ThreeScene; 
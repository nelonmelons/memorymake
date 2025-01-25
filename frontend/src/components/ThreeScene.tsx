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
  localObjPath?: string;
  onLoadProgress?: (progress: number) => void;
  onLoadError?: (error: string) => void;
  onLoadComplete?: () => void;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
  objUrl,
  localObjPath,
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

  // Load model function
  const loadModel = (path: string) => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    const loader = new OBJLoader();
    console.log('Loading model from:', path);
    
    loader.load(
      path,
      (object) => {
        if (sceneRef.current && cameraRef.current && controlsRef.current) {
          // Center and scale the loaded object
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          // Scale the model to create a larger viewing space
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2000.0 / maxDim; // MUCH larger scale
          
          // Position the object EXTREMELY close to the camera
          object.position.set(100, 120, 80); // Ultra close to camera (changed from -10 to -2)
          object.scale.multiplyScalar(scale);

          // Flip normals and rotate for correct orientation
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) {
                // Scale to create wrap-around effect
                child.geometry.scale(1, -1, 1); // Invert X to create inside-out view
                child.geometry = child.geometry.toNonIndexed(); // Allow for better normal manipulation
              }
              if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  metalness: 0.0,
                  roughness: 0.5,
                  side: THREE.BackSide // Render inside of geometry
                });
              } else if (child.material instanceof THREE.Material) {
                child.material.side = THREE.BackSide; // Render inside of geometry
              }
            }
          });
          
          // Remove previous model if exists
          if (modelRef.current) {
            sceneRef.current.remove(modelRef.current);
          }
          
          // Rotate to create proper wrap-around orientation
          object.rotation.set(0, Math.PI, 0);
          
          sceneRef.current.add(object);
          modelRef.current = object;

          // Reset camera and controls
          cameraRef.current.position.set(0, 0, 0);
          controlsRef.current.target.set(0, 0, -10);
          controlsRef.current.update();
          
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
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      100, // Reduced FOV to minimize distortion (from 120)
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.01,
      20000
    );
    camera.position.set(0, 0, 0);
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

    // Controls setup for spherical viewing
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.rotateSpeed = 0.3; // Slower rotation for more precise control
    controls.enableZoom = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 3;
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.maxPolarAngle = Math.PI * 0.75; // Reduced vertical rotation range
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxAzimuthAngle = Math.PI * 0.75; // Reduced horizontal rotation range
    controls.minAzimuthAngle = -Math.PI * 0.75;
    controls.target.set(0, 0, -10); // Match ultra-close object position
    controlsRef.current = controls;

    // Simple lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load model if URL or path is provided
    if (objUrl) {
      loadModel(objUrl);
    } else if (localObjPath) {
      loadModel(localObjPath);
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
  }, [objUrl, localObjPath]);

  return <Canvas ref={canvasRef} />;
};

export default ThreeScene; 
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

    // Camera setup - adjusted for better initial view
    const camera = new THREE.PerspectiveCamera(
      45, // Reduced FOV for less distortion
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    // Position camera at an angle for better initial view
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setClearColor(0x1a1a1a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true; // Enable screen space panning
    controls.rotateSpeed = 0.8;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 1.5; // Limit vertical rotation
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Lighting setup - improved for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, -5, 0);
    scene.add(backLight);

    // Ground plane for shadows
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // Add placeholder cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x5f5fff,
      metalness: 0.1,
      roughness: 0.8,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.position.set(0, 0, 0);
    scene.add(cube);
    modelRef.current = cube;

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
      
      if (modelRef.current && !objUrl) {
        modelRef.current.rotation.y += 0.005; // Slower rotation
      }
      
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

  // Handle model loading
  useEffect(() => {
    if (!objUrl || !sceneRef.current || loadingRef.current || objUrl === currentUrlRef.current) return;

    console.log('Starting to load model:', objUrl);
    loadingRef.current = true;
    currentUrlRef.current = objUrl;

    const loader = new OBJLoader();
    
    const cleanupPreviousModel = () => {
      console.log('Cleaning up previous model');
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        
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
      }
    };

    cleanupPreviousModel();

    try {
      loader.load(
        objUrl,
        (object) => {
          console.log('Model loaded, processing...');
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

            // Add materials and shadows
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (!child.material) {
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xcccccc,
                    metalness: 0.1,
                    roughness: 0.8,
                  });
                }
              }
            });
            
            sceneRef.current.add(object);
            modelRef.current = object;

            // Reset camera to isometric view
            cameraRef.current.position.set(5, 5, 5);
            if (controlsRef.current) {
              controlsRef.current.reset();
              controlsRef.current.target.set(0, 0, 0);
              controlsRef.current.update();
            }
            
            console.log('Model added to scene');
            loadingRef.current = false;
            onLoadComplete?.();
          }
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress = Math.min((xhr.loaded / xhr.total) * 100, 100);
            console.log('Loading progress:', progress);
            onLoadProgress?.(progress);
          }
        },
        (error) => {
          console.error('Error loading model:', error);
          loadingRef.current = false;
          currentUrlRef.current = '';
          onLoadError?.(error.message || 'Failed to load model');
          
          // Restore placeholder cube on error
          if (sceneRef.current) {
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshStandardMaterial({
              color: 0x5f5fff,
              metalness: 0.1,
              roughness: 0.8,
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.position.set(0, 0, 0);
            sceneRef.current.add(cube);
            modelRef.current = cube;
          }
        }
      );
    } catch (error) {
      console.error('Error in load effect:', error);
      loadingRef.current = false;
      currentUrlRef.current = '';
      onLoadError?.('Failed to load model: ' + (error as Error).message);
    }

    return () => {
      loadingRef.current = false;
    };
  }, [objUrl, onLoadComplete, onLoadProgress, onLoadError]);

  return <Canvas ref={canvasRef} />;
};

export default ThreeScene; 
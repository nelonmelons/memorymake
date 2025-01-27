import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import styled from '@emotion/styled';

const Canvas = styled.div`
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);

  canvas {
    width: 100% !important;
    height: 100% !important;
    display: block; /* Prevent any extra spacing */
  }

  &:fullscreen {
    border-radius: 0;
    box-shadow: none;
    background: var(--bg-primary);
    width: 100vw;
    height: 100vh;
    
    canvas {
      width: 100vw !important;
      height: 100vh !important;
    }
  }
`;

interface ThreeSceneProps {
  objUrl?: string;
  onLoadProgress?: (progress: number) => void;
  onLoadError?: (error: string) => void;
  onLoadComplete?: () => void;
  zoom?: number;
  isPanning?: boolean;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
  objUrl,
  onLoadProgress,
  onLoadError,
  onLoadComplete,
  zoom = 1,
  isPanning = false
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

  // Add keyboard control state
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  const panSpeed = 50; // Adjust this value to control pan speed

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
          
          // Position the object for optimal viewing
          object.position.set(100, 150, 100); //DO NOT FUCKING CHANGE THESE DIMENSIONS
          object.scale.multiplyScalar(scale);

          // Flip normals and rotate for correct orientation
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) {
                // Scale to create wrap-around effect
                child.geometry.scale(1, -1, 1);
                child.geometry = child.geometry.toNonIndexed();
                child.geometry.computeVertexNormals(); // Enhance lighting quality
              }
              if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  metalness: 0.15,
                  roughness: 0.5,
                  side: THREE.BackSide,
                  envMapIntensity: 1.0,
                  flatShading: false
                });
              } else if (child.material instanceof THREE.Material) {
                child.material.side = THREE.BackSide;
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

    // Add floor and ceiling
    const floorGeometry = new THREE.CircleGeometry(2000, 32);
    const ceilingGeometry = new THREE.CircleGeometry(2000, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const floor = new THREE.Mesh(floorGeometry, groundMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -1000;
    scene.add(floor);

    const ceiling = new THREE.Mesh(ceilingGeometry, groundMaterial);
    ceiling.receiveShadow = true;
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.position.y = 1000;
    scene.add(ceiling);

    // Camera setup with enhanced settings
    const camera = new THREE.PerspectiveCamera(
      75, // Balanced FOV for better perspective
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      5000 // Increased far plane for better zoom out
    );
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Enhanced renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setClearColor(0x1a1a1a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Enhanced controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.8;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 1000;
    controls.panSpeed = 1.0;
    controls.enablePan = true;
    controls.autoRotate = false;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.target.set(0, 0, -10);
    controlsRef.current = controls;

    // Enhanced lighting setup with shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 5000;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    // Adjusted rim lights for depth
    const rimLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight1.position.set(-8, 5, -5);
    rimLight1.castShadow = true;
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight2.position.set(8, -5, -5);
    rimLight2.castShadow = true;
    scene.add(rimLight2);

    // Brighter fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(0, 0, 8);
    fillLight.castShadow = true;
    scene.add(fillLight);

    // Brighter colored accent lights
    const blueLight = new THREE.PointLight(0x4477ff, 0.5);
    blueLight.position.set(-10, 0, 5);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0xff44ff, 0.4);
    purpleLight.position.set(10, 0, 5);
    scene.add(purpleLight);

    // Load model if URL is provided
    if (objUrl) {
      loadModel(objUrl);
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

        // Handle keyboard panning
        if (isPanning && cameraRef.current) {
          if (keys.w) cameraRef.current.position.z -= panSpeed;
          if (keys.s) cameraRef.current.position.z += panSpeed;
          if (keys.a) cameraRef.current.position.x -= panSpeed;
          if (keys.d) cameraRef.current.position.x += panSpeed;
        }
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
  }, [objUrl, isPanning]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enablePan = true;
      controlsRef.current.enableRotate = !isPanning;
      controlsRef.current.screenSpacePanning = true;
      controlsRef.current.panSpeed = 2.0;
      
      if (isPanning) {
        controlsRef.current.mouseButtons = {
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        };
      } else {
        controlsRef.current.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        };
      }
      
      // Ensure controls are properly updated
      controlsRef.current.update();
    }
  }, [isPanning]);

  // Remove keyboard controls as they might be causing issues
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    return () => {
      if (controls) {
        controls.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.zoom = zoom;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [zoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPanning) return;
      
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);

  return <Canvas ref={canvasRef} />;
};

export default ThreeScene; 
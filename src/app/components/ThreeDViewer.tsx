'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // Keep this for now, will re-address linter error later

interface ThreeDViewerProps {
    model?: THREE.Object3D | null; // Optional prop to pass the 3D model, allowing null
    pointSize?: number; // New prop for point size
}

export default function ThreeDViewer({ model, pointSize }: ThreeDViewerProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const currentModelRef = useRef<THREE.Object3D | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // Changed to black
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            currentMount.clientWidth / currentMount.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 5;
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls setup
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        // controls.maxPolarAngle = Math.PI / 2; // Removed for more natural interaction
        controlsRef.current = controls;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            if (cameraRef.current && rendererRef.current && mountRef.current) {
                cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (rendererRef.current && currentMount.contains(rendererRef.current.domElement)) {
                currentMount.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current?.dispose();
            controlsRef.current?.dispose();
        };
    }, []);

    // Effect to add/remove model to the scene
    useEffect(() => {
        if (sceneRef.current) {
            // Remove previous model if exists
            if (currentModelRef.current) {
                sceneRef.current.remove(currentModelRef.current);
                currentModelRef.current = null;
            }

            // Add new model if provided
            if (model) {
                sceneRef.current.add(model);
                currentModelRef.current = model;

                // Optional: Fit model to view
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = cameraRef.current ? cameraRef.current.fov * (Math.PI / 180) : 75 * (Math.PI / 180);
                const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

                if (cameraRef.current) {
                    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
                    cameraRef.current.lookAt(center);
                }
                if (controlsRef.current) {
                    controlsRef.current.target.set(center.x, center.y, center.z);
                    controlsRef.current.update();
                }
            }
        }
    }, [model]); // Rerun this effect when the 'model' prop changes

    // Effect to update point size
    useEffect(() => {
        if (currentModelRef.current instanceof THREE.Points && pointSize !== undefined) {
            const material = currentModelRef.current.material as THREE.PointsMaterial;
            material.size = pointSize;
            material.needsUpdate = true;
        }
    }, [pointSize]); // Rerun this effect when the 'pointSize' prop changes

    return (
        <div ref={mountRef} className="w-full h-full relative">
            {/* Three.js canvas will be appended here */}
        </div>
    );
} 
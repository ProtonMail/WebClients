import * as THREE from 'three';

import { STLLoader } from './ThreeAddons/STLLoader';
import { TrackballControls } from './ThreeAddons/TrackballControls';

/**
 * Interface for the scene reference object that provides cleanup methods
 */
export interface SceneRef {
    dispose: () => void;
}

/**
 * Configuration constants for the STL preview
 */
export const STL_PREVIEW_CONFIG = {
    backgroundColor: 0xffffff,
    fov: 45,
    zoomFactor: 1.5,
    objectColor: 0xe0e0e0,
    rotateSpeed: 2.5,
    zoomSpeed: 1.2,
    panSpeed: 0.8,
    edgeColor: 0x999999,
    edgeThreshold: 30,
};

/**
 * Creates and configures a Three.js scene with the appropriate background
 * @returns {THREE.Scene} The configured Three.js scene
 */
export function setupScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(STL_PREVIEW_CONFIG.backgroundColor);
    return scene;
}

/**
 * Creates and configures a perspective camera for the 3D view
 * @param {number} width - The viewport width
 * @param {number} height - The viewport height
 * @returns {THREE.PerspectiveCamera} The configured camera
 */
export function setupCamera(width: number, height: number): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(STL_PREVIEW_CONFIG.fov, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    return camera;
}

/**
 * Creates and configures a WebGL renderer with appropriate settings
 * @param {HTMLDivElement} container - The DOM element to render into
 * @returns {THREE.WebGLRenderer} The configured renderer
 */
export function setupRenderer(container: HTMLDivElement): THREE.WebGLRenderer {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = false;

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('mousedown', () => {
        renderer.domElement.style.cursor = 'grabbing';
    });
    renderer.domElement.addEventListener('mouseup', () => {
        renderer.domElement.style.cursor = 'grab';
    });

    return renderer;
}

/**
 * Creates a basic material for the STL model
 * @returns {THREE.MeshBasicMaterial} The configured material
 */
export function createMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
        color: STL_PREVIEW_CONFIG.objectColor,
        side: THREE.DoubleSide,
    });
}

/**
 * Creates a material for the wireframe edges of the STL model
 * @returns {THREE.LineBasicMaterial} The configured edge material
 */
export function createEdgeMaterial(): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
        color: STL_PREVIEW_CONFIG.edgeColor,
        transparent: true,
        opacity: 0.7,
    });
}

/**
 * Sets up interactive camera controls for the 3D view
 * @param {THREE.PerspectiveCamera} camera - The camera to control
 * @param {HTMLElement} domElement - The DOM element to attach controls to
 * @returns {TrackballControls} The configured controls
 */
export function setupControls(camera: THREE.PerspectiveCamera, domElement: HTMLElement): TrackballControls {
    const controls = new TrackballControls(camera, domElement);

    controls.rotateSpeed = STL_PREVIEW_CONFIG.rotateSpeed;
    controls.zoomSpeed = STL_PREVIEW_CONFIG.zoomSpeed;
    controls.panSpeed = STL_PREVIEW_CONFIG.panSpeed;
    controls.noRotate = false;
    controls.dynamicDampingFactor = 0.1;

    domElement.style.touchAction = 'none';

    return controls;
}

/**
 * Loads an STL model from binary data and positions it in the scene
 * @param {ArrayBuffer} stlData - Binary STL data
 * @param {THREE.Scene} scene - The scene to add the model to
 * @param {THREE.PerspectiveCamera} camera - The camera to position
 * @param {TrackballControls} controls - The controls to configure
 * @returns {{ group: THREE.Group }} An object containing the model group
 */
export function loadSTLModel(
    stlData: ArrayBuffer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: TrackballControls
): { group: THREE.Group } {
    const geometry = new STLLoader().parse(stlData);
    geometry.computeVertexNormals();

    const group = new THREE.Group();

    const material = createMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry, STL_PREVIEW_CONFIG.edgeThreshold);
    const wireframe = new THREE.LineSegments(edges, createEdgeMaterial());

    group.add(mesh);
    group.add(wireframe);

    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox as THREE.Box3;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    group.position.set(-center.x, -center.y, -center.z);

    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = STL_PREVIEW_CONFIG.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
    cameraZ *= STL_PREVIEW_CONFIG.zoomFactor;

    camera.position.set(cameraZ * 0.8, cameraZ * 0.6, cameraZ);
    controls.target.set(0, 0, 0);

    scene.add(group);

    camera.near = cameraZ / 100;
    camera.far = cameraZ * 100;
    camera.updateProjectionMatrix();

    controls.update();

    return { group };
}

/**
 * Sets up the animation loop for continuous rendering
 * @param {THREE.WebGLRenderer} renderer - The renderer to use
 * @param {THREE.Scene} scene - The scene to render
 * @param {THREE.PerspectiveCamera} camera - The camera to render from
 * @param {TrackballControls} controls - The controls to update each frame
 */
export function setupAnimation(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: TrackballControls
): void {
    const animate = (): void => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();
}

/**
 * Sets up a handler for window resize events to properly update the renderer and camera
 * @param {HTMLDivElement} container - The container element
 * @param {THREE.PerspectiveCamera} camera - The camera to update
 * @param {THREE.WebGLRenderer} renderer - The renderer to resize
 * @returns {() => void} The resize handler function
 */
export function setupResizeHandler(
    container: HTMLDivElement,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
): () => void {
    const handleResize = (): void => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return handleResize;
}

/**
 * Initializes the Three.js environment for STL preview
 * @param {HTMLDivElement} container - The container element to render into
 * @param {ArrayBuffer} stlData - The binary STL data to display
 * @returns {SceneRef} A reference object with cleanup methods
 */
export function initThreeJS(container: HTMLDivElement, stlData: ArrayBuffer): SceneRef {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = setupScene();
    const camera = setupCamera(width, height);
    const renderer = setupRenderer(container);
    container.appendChild(renderer.domElement);
    const controls = setupControls(camera, renderer.domElement);

    loadSTLModel(stlData, scene, camera, controls);
    setupAnimation(renderer, scene, camera, controls);

    const handleResize = setupResizeHandler(container, camera, renderer);

    return {
        dispose: (): void => {
            window.removeEventListener('resize', handleResize);
            controls.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
            }
        },
    };
}

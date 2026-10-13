import {
    AmbientLight, Box3, Camera, Color, DirectionalLight, Mesh, MeshStandardMaterial, Object3D,
    OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, Vector2, Vector3, WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LoadedDevice, disposeObject} from '../core/device-loader';
import {DeviceState} from '../core/device-state';
import {RegisteredControl, nearestControl} from '../core/naming';
import {angle, increment} from '../core/control-mapping';
import {evaluate} from '../core/rules';
import {CanvasSurfaces} from './canvas-surfaces';
import {AnimationController} from './animation-controller';
import {controlAxis} from './control-axis';

interface ControlPose {control: RegisteredControl; initial: Quaternion; current: number; target: number; start: number; elapsed: number;}

export class SceneController {
    private readonly renderer = new WebGLRenderer({antialias: true, alpha: false});
    private readonly scene = new Scene();
    private camera: Camera = new PerspectiveCamera(42, 1, 0.01, 500);
    private readonly orbit: OrbitControls;
    private readonly raycaster = new Raycaster();
    private readonly resizeObserver: ResizeObserver;
    private readonly surfaces: CanvasSurfaces;
    private readonly animation: AnimationController;
    private readonly poses: ControlPose[];
    private readonly unsubscribe: () => void;
    private drag?: {control: RegisteredControl; y: number; value: number; pointerId: number};
    private selected?: RegisteredControl;
    private frame = 0;
    private lastTime = 0;
    private destroyed = false;
    private dirty = true;
    private authoredFov = 42;
    sourceLabel = 'DEMO · browser crypto';
    sample: () => number = () => 0;

    constructor(private readonly host: HTMLElement, readonly loaded: LoadedDevice, readonly store: DeviceState) {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(new Color('#17242c'));
        const canvas = this.renderer.domElement;
        canvas.tabIndex = 0;
        canvas.setAttribute('aria-label', '3D device. Select a knob, then use arrow keys, Home or End.');
        host.appendChild(canvas);
        this.scene.add(new AmbientLight(0xffffff, 2));
        const light = new DirectionalLight(0xffffff, 3);
        light.position.set(3, 8, 4);
        this.scene.add(light, loaded.root);
        loaded.registry.bindings.filter(binding => binding.target === 'led').forEach(binding => {
            loaded.registry.objects.get(binding.object)?.traverse(node => {
                if (node instanceof Mesh) {
                    node.material = Array.isArray(node.material) ? node.material.map(material => material.clone()) : node.material.clone();
                }
            });
        });
        this.orbit = new OrbitControls(this.camera, canvas);
        this.orbit.enableDamping = true;
        this.orbit.minDistance = 3;
        this.orbit.maxDistance = 30;
        this.poses = loaded.registry.controls.map(control => ({control, initial: control.object.quaternion.clone(),
            current: NaN, target: NaN, start: 0, elapsed: 0}));
        this.surfaces = new CanvasSurfaces(loaded, store);
        this.animation = new AnimationController(loaded.root, loaded.clips, store, loaded.registry.controls,
            loaded.registry.diagnostics, loaded.registry.bindings);
        this.unsubscribe = store.bus.subscribe(store.instanceId, () => this.dirty = true);
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(host);
        canvas.addEventListener('pointerdown', this.pointerDown, {capture: true});
        canvas.addEventListener('pointermove', this.pointerMove);
        canvas.addEventListener('pointerup', this.pointerUp);
        canvas.addEventListener('pointercancel', this.pointerUp);
        canvas.addEventListener('lostpointercapture', this.pointerUp);
        canvas.addEventListener('keydown', this.keyDown);
        this.setCamera(false);
        this.frame = requestAnimationFrame(this.render);
    }

    setCamera(manual: boolean): void {
        const name = manual ? this.loaded.definition.cameras?.manual : this.loaded.definition.cameras?.default;
        const authored = name ? this.loaded.registry.objects.get(name) : undefined;
        this.loaded.root.updateMatrixWorld(true);
        if (authored instanceof Camera) {
            this.camera = authored.clone();
            authored.getWorldPosition(this.camera.position);
            authored.getWorldQuaternion(this.camera.quaternion);
            this.camera.up.copy(manual ? new Vector3(0, 1, 0) : new Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion));
        } else {
            const camera = new PerspectiveCamera(42, 1, 0.01, 500);
            const bounds = new Box3().setFromObject(this.loaded.root);
            const center = bounds.getCenter(new Vector3());
            const size = Math.max(bounds.getSize(new Vector3()).length(), 3);
            camera.position.copy(center).add(manual ? new Vector3(size, size, size) : new Vector3(0, size * 1.3, 0.01));
            camera.lookAt(center);
            this.camera = camera;
        }
        this.orbit.object = this.camera;
        this.orbit.target.fromArray(this.loaded.definition.cameras?.target ?? [0, 0, 0]);
        this.authoredFov = this.camera instanceof PerspectiveCamera ? this.camera.fov : 42;
        this.orbit.enableRotate = manual;
        this.orbit.update();
        this.resize();
    }

    destroy(): void {
        this.destroyed = true;
        cancelAnimationFrame(this.frame);
        this.unsubscribe();
        this.resizeObserver.disconnect();
        const canvas = this.renderer.domElement;
        canvas.removeEventListener('pointerdown', this.pointerDown, {capture: true});
        canvas.removeEventListener('pointermove', this.pointerMove);
        canvas.removeEventListener('pointerup', this.pointerUp);
        canvas.removeEventListener('pointercancel', this.pointerUp);
        canvas.removeEventListener('lostpointercapture', this.pointerUp);
        canvas.removeEventListener('keydown', this.keyDown);
        this.orbit.dispose();
        this.animation.destroy();
        this.surfaces.destroy();
        disposeObject(this.loaded.root);
        this.renderer.dispose();
        this.renderer.forceContextLoss();
        canvas.remove();
    }

    private resize(): void {
        const width = Math.max(this.host.clientWidth, 1);
        const height = Math.max(this.host.clientHeight, 1);
        this.renderer.setSize(width, height);
        if (this.camera instanceof PerspectiveCamera) {
            this.camera.aspect = width / height;
            this.camera.updateMatrixWorld(true);
            const bounds = new Box3().setFromObject(this.loaded.root);
            let tangent = 0;
            for (const x of [bounds.min.x, bounds.max.x]) {
                for (const y of [bounds.min.y, bounds.max.y]) {
                    for (const z of [bounds.min.z, bounds.max.z]) {
                        const point = new Vector3(x, y, z).applyMatrix4(this.camera.matrixWorldInverse);
                        const distance = Math.max(-point.z, 0.1);
                        tangent = Math.max(tangent, Math.abs(point.y) / distance, Math.abs(point.x) / distance / this.camera.aspect);
                    }
                }
            }
            this.camera.fov = Math.min(100, Math.max(this.authoredFov, 2 * Math.atan(tangent * 1.12) * 180 / Math.PI));
            this.camera.updateProjectionMatrix();
        } else if (this.camera instanceof OrthographicCamera) {
            const halfHeight = (this.camera.top - this.camera.bottom) / 2;
            this.camera.left = -halfHeight * width / height;
            this.camera.right = halfHeight * width / height;
            this.camera.updateProjectionMatrix();
        }
    }

    private readonly render = (time: number): void => {
        if (this.destroyed) {
            return;
        }
        const delta = Math.min((time - this.lastTime) / 1000 || 0, 0.1);
        this.lastTime = time;
        this.animation.update(delta);
        this.updateControls(delta);
        if (this.dirty) {
            this.updateBindings();
            this.dirty = false;
        }
        this.surfaces.update(time, this.sourceLabel, this.sample());
        this.orbit.update();
        this.renderer.render(this.scene, this.camera);
        this.frame = requestAnimationFrame(this.render);
    };

    private updateControls(delta: number): void {
        this.poses.forEach(pose => {
            const config = pose.control.config;
            if (config.type === 'button' && config.mode !== 'toggle') {
                return;
            }
            const value = this.store.state[pose.control.stateId];
            const target = config.type === 'knob' ? angle(Number(value), config)
                : value ? config.onAngle ?? 25 : config.offAngle ?? -25;
            if (Number.isNaN(pose.current)) {
                pose.current = target;
            }
            if (pose.target !== target) {
                pose.start = pose.current;
                pose.target = target;
                pose.elapsed = 0;
            }
            pose.elapsed = Math.min(0.12, pose.elapsed + delta);
            const progress = 1 - Math.pow(1 - pose.elapsed / 0.12, 3);
            pose.current = pose.start + (target - pose.start) * progress;
            const axis = controlAxis(config.axis, Boolean(this.loaded.root.userData['blenderConvertedAxes']));
            pose.control.object.quaternion.copy(pose.initial).multiply(new Quaternion().setFromAxisAngle(axis, pose.current * Math.PI / 180));
        });
    }

    private updateBindings(): void {
        this.loaded.registry.bindings.forEach(binding => {
            const object = this.loaded.registry.objects.get(binding.object)!;
            const enabled = binding.when ? evaluate(binding.when, this.store.state) : Boolean(this.store.state[binding.source ?? '']);
            if (binding.target === 'visibility') {
                object.visible = enabled;
            } else if (binding.target === 'led') {
                object.traverse(node => {
                    if (!(node instanceof Mesh)) {
                        return;
                    }
                    const materials = Array.isArray(node.material) ? node.material : [node.material];
                    materials.forEach(material => {
                        if (material instanceof MeshStandardMaterial) {
                            material.emissive.set(enabled ? binding.color ?? '#ff9240' : '#000000');
                            material.emissiveIntensity = enabled ? 3 : 0;
                        }
                    });
                });
            }
        });
    }

    private readonly pointerDown = (event: PointerEvent): void => {
        if (event.button !== 0 || this.drag) {
            return;
        }
        const bounds = this.renderer.domElement.getBoundingClientRect();
        const pointer = new Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1,
            -(event.clientY - bounds.top) / bounds.height * 2 + 1);
        this.raycaster.setFromCamera(pointer, this.camera);
        const hit = this.raycaster.intersectObject(this.loaded.root, true)[0];
        const control = hit ? nearestControl(hit.object, this.loaded.registry.controls) : undefined;
        if (!control) {
            return;
        }
        event.stopImmediatePropagation();
        event.preventDefault();
        this.selected = control;
        this.orbit.enabled = false;
        this.renderer.domElement.focus();
        this.renderer.domElement.setPointerCapture(event.pointerId);
        this.drag = {control, y: event.clientY, value: Number(this.store.state[control.stateId]), pointerId: event.pointerId};
        if (control.config.type === 'switch' || control.config.mode === 'toggle') {
            this.store.set(control.stateId, !this.store.state[control.stateId]);
        } else if (control.config.type === 'button') {
            this.store.action(control.config.action ?? `${control.stateId}.toggle`);
        }
    };

    private readonly pointerMove = (event: PointerEvent): void => {
        if (!this.drag || this.drag.pointerId !== event.pointerId || this.drag.control.config.type !== 'knob') {
            return;
        }
        const {control, y, value} = this.drag;
        const steps = Math.round((y - event.clientY) / (control.config.dragPixelsPerStep ?? 24));
        this.store.set(control.stateId, increment(value, steps, control.config));
    };

    private readonly pointerUp = (): void => {
        if (this.drag?.control.config.type === 'button' && this.drag.control.config.mode !== 'toggle') {
            this.store.action(this.drag.control.config.action ?? `${this.drag.control.stateId}.toggle`, false);
        }
        this.drag = undefined;
        this.orbit.enabled = true;
    };

    private readonly keyDown = (event: KeyboardEvent): void => {
        const control = this.selected;
        if (!control) {
            return;
        }
        if (control.config.type === 'knob' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const value = Number(this.store.state[control.stateId]);
            const next = event.key === 'Home' ? control.config.minValue ?? 0 : event.key === 'End' ? control.config.maxValue ?? 9
                : increment(value, ['ArrowUp', 'ArrowRight'].includes(event.key) ? 1 : -1, control.config);
            this.store.set(control.stateId, next);
        } else if (['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (control.config.type === 'button' && control.config.mode !== 'toggle') {
                this.store.action(control.config.action ?? `${control.stateId}.toggle`);
                this.store.action(control.config.action ?? `${control.stateId}.toggle`, false);
            } else if (control.config.type !== 'knob') {
                this.store.set(control.stateId, !this.store.state[control.stateId]);
            }
        }
    };
}

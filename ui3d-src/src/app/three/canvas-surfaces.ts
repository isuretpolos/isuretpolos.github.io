import {CanvasTexture, DoubleSide, Material, Mesh, MeshBasicMaterial, SRGBColorSpace, Texture, Vector3} from 'three';
import {LoadedDevice} from '../core/device-loader';
import {DeviceState} from '../core/device-state';
import {evaluate} from '../core/rules';
import {Binding} from '../models/device.types';

interface Surface {
    binding: Binding;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    texture: CanvasTexture;
    material: MeshBasicMaterial;
    lastText: string;
    broadcast: boolean;
    fps: number;
    lastFrame: number;
}

export class CanvasSurfaces {
    private readonly surfaces: Surface[] = [];
    private readonly replacedMaterials = new Set<Material>();

    constructor(private readonly loaded: LoadedDevice, private readonly store: DeviceState) {
        loaded.registry.bindings.filter(binding => ['text', 'surface'].includes(binding.target)).forEach(binding => this.add(binding, false));
        const configured = loaded.definition.broadcastSurfaces ?? [];
        configured.forEach(surface => this.add({object: surface.object, target: 'surface', source: surface.source,
            when: surface.enabledWhen}, true, surface.resolution, surface.fps));
        loaded.registry.objects.forEach((_, name) => {
            if (/^broadcastCanvas(?:_|$)/.test(name) && !configured.some(surface => surface.object === name)) {
                const group = loaded.definition.rateGroups[0];
                if (group) {
                    this.add({object: name, target: 'surface', source: `broadcast.${group.id}`, when: 'power && broadcast'}, true);
                }
            }
        });
    }

    update(time: number, sourceLabel: string, sample = 0): void {
        this.surfaces.forEach(surface => {
            const active = !surface.binding.when || evaluate(surface.binding.when, this.store.state);
            const text = active ? String(this.store.state[surface.binding.source ?? ''] ?? '') : '';
            if (surface.broadcast) {
                if (!active && surface.lastText === '') {
                    return;
                }
                if (active && time - surface.lastFrame < 1000 / surface.fps) {
                    return;
                }
                surface.lastFrame = time;
            } else if (surface.lastText === text) {
                return;
            }
            surface.lastText = text;
            const {context, canvas} = surface;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillStyle = surface.binding.color ?? loadedColor(this.loaded);
            if (surface.broadcast && active) {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                context.strokeStyle = '#84b9b6';
                context.lineWidth = 2;
                for (let index = 0; index < 6; index++) {
                    const radius = ((time / 35 + index * 35 + sample / 16) % 220) + 8;
                    context.globalAlpha = 1 - radius / 240;
                    context.beginPath();
                    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    context.stroke();
                }
                context.globalAlpha = 1;
                context.font = 'bold 50px monospace';
                context.fillText(text, centerX, centerY);
                context.font = '22px monospace';
                context.fillText(this.store.mode.toUpperCase(), centerX, 40);
                context.font = '16px monospace';
                context.fillText(sourceLabel, centerX, canvas.height - 45);
                if (this.store.mode === 'snapshot' && this.store.signatureChanged) {
                    context.fillText('Knobs differ from snapshot', centerX, canvas.height - 20);
                }
            } else if (active) {
                const font = Math.min(canvas.height * 0.75, surface.binding.fontSize ?? this.loaded.definition.canvasDefaults?.fontSize ?? 130);
                context.font = `${font}px ${this.loaded.definition.canvasDefaults?.fontFamily ?? 'monospace'}`;
                context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * 0.92);
            }
            surface.texture.needsUpdate = true;
        });
    }

    destroy(): void {
        this.surfaces.forEach(surface => {
            surface.texture.dispose();
            surface.material.dispose();
        });
        this.replacedMaterials.forEach(material => {
            Object.values(material).forEach(value => {
                if (value instanceof Texture) {
                    value.dispose();
                }
            });
            material.dispose();
        });
    }

    private add(binding: Binding, broadcast: boolean, resolution?: number[], fps = 24): void {
        const object = this.loaded.registry.objects.get(binding.object);
        if (!(object instanceof Mesh) || !object.geometry.getAttribute('uv')) {
            this.loaded.registry.diagnostics.push({level: 'warning', message: `Canvas needs mesh and UVs: ${binding.object}`});
            return;
        }
        const canvas = document.createElement('canvas');
        const size = resolution ?? this.loaded.definition.canvasDefaults?.resolution ?? [512, 256];
        canvas.width = Math.min(2048, size[0]);
        canvas.height = Math.min(2048, size[1]);
        if (!broadcast) {
            const aspect = planeAspect(object);
            if (aspect > 0) {
                canvas.height = Math.max(64, Math.min(2048, Math.round(canvas.width / aspect)));
            }
        }
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas 2D rendering unavailable.');
        }
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.flipY = Boolean(this.loaded.root.userData['procedural']);
        const material = new MeshBasicMaterial({map: texture, transparent: true, depthWrite: false,
            side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -1});
        const previous = Array.isArray(object.material) ? object.material : [object.material];
        previous.forEach(item => this.replacedMaterials.add(item));
        object.material = material;
        this.surfaces.push({binding, canvas, context, texture, material, lastText: '\0', broadcast, fps, lastFrame: -Infinity});
    }
}

function loadedColor(loaded: LoadedDevice): string {
    return loaded.definition.canvasDefaults?.color ?? '#ffbe74';
}

function planeAspect(mesh: Mesh): number {
    mesh.updateWorldMatrix(true, false);
    const positions = mesh.geometry.getAttribute('position');
    const uv = mesh.geometry.getAttribute('uv');
    const start = new Vector3().fromBufferAttribute(positions, 0).applyMatrix4(mesh.matrixWorld);
    let width = 0;
    let height = 0;
    for (let index = 1; index < positions.count; index++) {
        const distance = new Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld).distanceTo(start);
        const u = Math.abs(uv.getX(index) - uv.getX(0));
        const v = Math.abs(uv.getY(index) - uv.getY(0));
        if (u > 0.001 && v < 0.001) {
            width = distance / u;
        }
        if (v > 0.001 && u < 0.001) {
            height = distance / v;
        }
    }
    return height > 0 ? width / height : 0;
}

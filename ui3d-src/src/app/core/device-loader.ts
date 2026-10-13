import {AnimationClip, Group, Material, Mesh, Object3D, Texture} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {DeviceDefinition, Diagnostic} from '../models/device.types';
import {createDemo} from '../three/demo-device';
import {discover, Registry} from './naming';
import {validateDefinition} from './validation';

export interface LoadedDevice {
    root: Object3D;
    clips: AnimationClip[];
    definition: DeviceDefinition;
    registry: Registry;
    contentHash?: string;
}

export function disposeObject(root: Object3D): void {
    const materials = new Set<Material>();
    const textures = new Set<Texture>();
    root.traverse(node => {
        if (node instanceof Mesh) {
            node.geometry.dispose();
            (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => {
                materials.add(material);
                Object.values(material).forEach(value => {
                    if (value instanceof Texture) {
                        textures.add(value);
                    }
                });
            });
        }
    });
    textures.forEach(texture => texture.dispose());
    materials.forEach(material => material.dispose());
}

export class DeviceLoader {
    private readonly draco = new DRACOLoader().setDecoderPath('decoders/draco/');
    private readonly loader = new GLTFLoader().setDRACOLoader(this.draco).setMeshoptDecoder(MeshoptDecoder);

    demo(procedural = false): Promise<LoadedDevice> {
        return fetch('devices/classic-demo/device.json').then(response => {
            if (!response.ok) {
                throw new Error(`Demo configuration: HTTP ${response.status}`);
            }
            return response.json();
        }).then(json => {
            const definition = validateDefinition(json);
            if (procedural) {
                definition.model = 'procedural';
            }
            if (definition.model === 'procedural') {
                return this.finish(createDemo(), [], definition);
            }
            return fetch(`devices/classic-demo/${definition.model}`).then(response => {
                if (!response.ok) {
                    throw new Error(`Model: HTTP ${response.status}`);
                }
                return response.arrayBuffer();
            }).then(buffer => this.parse(buffer, definition));
        });
    }

    import(files: File[]): Promise<LoadedDevice> {
        const model = files.find(file => file.name.toLowerCase().endsWith('.glb'));
        const config = files.find(file => file.name === 'device.json');
        if (files.length !== 2 || !model || !config) {
            return Promise.reject(new Error('Select exactly one self-contained .glb and device.json.'));
        }
        if (config.size > 1024 * 1024 || model.size > 100 * 1024 * 1024) {
            return Promise.reject(new Error('Import exceeds 1 MB JSON or 100 MB model limit.'));
        }
        return config.text().then(text => {
            const definition = validateDefinition(JSON.parse(text));
            return Promise.all([
                model.arrayBuffer(),
                crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
            ]).then(([buffer, digest]) => this.parse(buffer, definition).then(loaded => {
                loaded.contentHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
                return loaded;
            }));
        });
    }

    destroy(): void {
        this.draco.dispose();
    }

    private parse(buffer: ArrayBuffer, definition: DeviceDefinition): Promise<LoadedDevice> {
        const mb = buffer.byteLength / 1024 / 1024;
        if (mb > (definition.limits?.maxModelMB ?? 100)) {
            return Promise.reject(new Error('Model exceeds configured hard size limit.'));
        }
        try {
            this.validateGlb(buffer);
        } catch (error) {
            return Promise.reject(error);
        }
        return this.loader.parseAsync(buffer, '').then(gltf => {
            // GLTFLoader sanitizes/uniquifies names. Validate the original glTF names instead.
            const originalNames = new Map<string, string>();
            gltf.scene.traverse(object => {
                const association = gltf.parser.associations.get(object);
                const node = association?.nodes === undefined ? undefined : gltf.parser.json.nodes[association.nodes];
                if (node?.name) {
                    originalNames.set(object.name, node.name.replace(/\.\d{3}$/, ''));
                    object.name = node.name;
                }
            });
            gltf.scene.userData['blenderConvertedAxes'] = /Blender I\/O/.test(gltf.asset.generator ?? '');
            const loaded = this.finish(gltf.scene, gltf.animations, definition);
            gltf.animations.forEach(clip => clip.tracks.forEach(track => {
                const separator = track.name.indexOf('.');
                const objectName = track.name.slice(0, separator);
                const restored = originalNames.get(objectName);
                if (restored && separator >= 0) {
                    track.name = restored + track.name.slice(separator);
                }
            }));
            if (mb > (definition.limits?.warnModelMB ?? 20)) {
                loaded.registry.diagnostics.push({level: 'warning', message: `Large model: ${mb.toFixed(1)} MB`});
            }
            return loaded;
        }).catch(error => {
            throw new Error(`GLB import failed: ${String(error)}`);
        });
    }

    private validateGlb(buffer: ArrayBuffer): void {
        if (buffer.byteLength < 20) {
            throw new Error('Invalid GLB header.');
        }
        const view = new DataView(buffer);
        if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2
            || view.getUint32(8, true) !== buffer.byteLength || view.getUint32(16, true) !== 0x4e4f534a) {
            throw new Error('Expected a valid glTF 2.0 binary.');
        }
        const length = view.getUint32(12, true);
        if (length > buffer.byteLength - 20) {
            throw new Error('Invalid GLB JSON chunk length.');
        }
        const json = JSON.parse(new TextDecoder().decode(buffer.slice(20, 20 + length)));
        const external = [...(json.buffers ?? []), ...(json.images ?? [])].some(item => item.uri && !item.uri.startsWith('data:'));
        if (external) {
            throw new Error('Only self-contained GLB files are accepted; external assets are forbidden.');
        }
        if ((json.extensionsRequired ?? []).includes('KHR_texture_basisu')) {
            throw new Error('KTX2 textures are not enabled; export PNG/JPEG textures.');
        }
        const supported = new Set(['KHR_draco_mesh_compression', 'KHR_lights_punctual', 'KHR_materials_anisotropy',
            'KHR_materials_clearcoat', 'KHR_materials_dispersion', 'KHR_materials_emissive_strength',
            'KHR_materials_ior', 'KHR_materials_specular', 'KHR_materials_sheen', 'KHR_materials_transmission',
            'KHR_materials_iridescence', 'KHR_materials_unlit', 'KHR_materials_volume', 'KHR_mesh_quantization',
            'KHR_meshopt_compression', 'KHR_texture_transform', 'EXT_materials_bump', 'EXT_meshopt_compression',
            'EXT_mesh_gpu_instancing', 'EXT_texture_avif', 'EXT_texture_webp']);
        const unsupported = (json.extensionsRequired ?? []).filter((name: string) => !supported.has(name));
        if (unsupported.length) {
            throw new Error(`Unsupported required glTF extensions: ${unsupported.join(', ')}`);
        }
    }

    private finish(root: Object3D, clips: AnimationClip[], definition: DeviceDefinition): LoadedDevice {
        const registry = discover(root, definition);
        const errors = registry.diagnostics.filter(item => item.level === 'error');
        if (errors.length) {
            disposeObject(root);
            throw new Error(errors.map(item => item.message).join('\n'));
        }
        const diagnostics: Diagnostic[] = registry.diagnostics;
        [definition.cameras?.default, definition.cameras?.manual].filter(Boolean).forEach(name => {
            if (!registry.objects.has(name!)) {
                diagnostics.push({level: 'warning', message: `Missing camera ${name}; using fallback.`});
            }
        });
        return {root, clips, definition, registry};
    }
}

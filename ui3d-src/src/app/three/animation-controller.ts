import {AnimationAction, AnimationClip, AnimationMixer, LoopOnce, LoopRepeat, Object3D} from 'three';
import {DeviceState} from '../core/device-state';
import {Binding, Diagnostic} from '../models/device.types';
import {RegisteredControl} from '../core/naming';

export class AnimationController {
    private readonly mixer: AnimationMixer;
    private readonly actions = new Map<string, AnimationAction>();
    private readonly active = new Map<string, AnimationAction>();
    private readonly retiring = new Map<AnimationAction, number>();
    private previous: Record<string, boolean> = {};

    constructor(root: Object3D, clips: AnimationClip[], private readonly store: DeviceState,
                controls: RegisteredControl[], diagnostics: Diagnostic[], bindings: Binding[] = []) {
        this.mixer = new AnimationMixer(root);
        const owned = new Set(controls.map(control => control.object.name));
        clips.forEach(clip => {
            const conflict = clip.tracks.some(track => {
                const name = track.name.split('.')[0];
                const binding = bindings.find(item => item.object === name);
                return (owned.has(name) && /quaternion|rotation/.test(track.name))
                    || (binding?.target === 'visibility' && /\.visible/.test(track.name))
                    || (binding && ['led', 'text', 'surface'].includes(binding.target) && /material|color|emissive/.test(track.name));
            });
            if (conflict) {
                diagnostics.push({level: 'warning', message: `Clip ${clip.name} conflicts with a state-owned visual channel; skipped.`});
            } else {
                this.actions.set(clip.name, this.mixer.clipAction(clip));
            }
        });
        Object.values(store.definition.animations ?? {}).forEach(mapping => Object.values(mapping).forEach(name => {
            if (name && !this.actions.has(name)) {
                diagnostics.push({level: 'warning', message: `Optional animation unavailable: ${name}`});
            }
        }));
        const channelOwners = new Map<string, string>();
        Object.entries(store.definition.animations ?? {}).forEach(([state, mapping]) => Object.values(mapping).forEach(name => {
            const action = name ? this.actions.get(name) : undefined;
            if (!action) {
                return;
            }
            const conflict = action.getClip().tracks.find(track => channelOwners.has(track.name) && channelOwners.get(track.name) !== state);
            if (conflict) {
                diagnostics.push({level: 'warning', message: `Clip ${name} conflicts with ${channelOwners.get(conflict.name)} ownership of ${conflict.name}; skipped.`});
                this.actions.delete(name!);
            } else {
                action.getClip().tracks.forEach(track => channelOwners.set(track.name, state));
            }
        }));
    }

    update(delta: number): void {
        Object.entries(this.store.definition.animations ?? {}).forEach(([key, mapping]) => {
            const enabled = Boolean(this.store.state[key]) && (key === 'power' || Boolean(this.store.state['power']));
            if (enabled !== this.previous[key]) {
                this.previous[key] = enabled;
                const old = this.active.get(key);
                if (old) {
                    old.fadeOut(0.12);
                    this.retiring.set(old, 0.12);
                    this.active.delete(key);
                }
                const name = enabled ? mapping.on ?? mapping.loop : mapping.off;
                const action = name ? this.actions.get(name) : undefined;
                if (action) {
                    this.retiring.delete(action);
                    action.reset().setLoop(name === mapping.loop ? LoopRepeat : LoopOnce, name === mapping.loop ? Infinity : 1);
                    action.clampWhenFinished = true;
                    action.fadeIn(0.12).play();
                    this.active.set(key, action);
                }
            }
            const active = this.active.get(key);
            if (enabled && active && !active.isRunning() && mapping.loop && this.actions.has(mapping.loop)) {
                active.stop();
                const loop = this.actions.get(mapping.loop)!;
                loop.reset().setLoop(LoopRepeat, Infinity).play();
                this.active.set(key, loop);
            }
        });
        this.retiring.forEach((remaining, action) => {
            if (remaining <= delta) {
                action.stop();
                this.retiring.delete(action);
            } else {
                this.retiring.set(action, remaining - delta);
            }
        });
        this.mixer.update(delta);
    }

    destroy(): void {
        this.mixer.stopAllAction();
        this.mixer.uncacheRoot(this.mixer.getRoot());
    }
}

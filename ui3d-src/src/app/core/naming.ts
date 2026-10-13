import {Object3D} from 'three';
import {Binding, Control, DeviceDefinition, Diagnostic, State} from '../models/device.types';
import {validateRange} from './control-mapping';
import {evaluate} from './rules';
import {validateBinding, validateControl} from './validation';

export interface RegisteredControl {object: Object3D; config: Control; stateId: string;}
export interface Registry {
    objects: Map<string, Object3D>;
    controls: RegisteredControl[];
    bindings: Binding[];
    diagnostics: Diagnostic[];
}

export function normalizedNames(names: string[]): {names: string[]; diagnostics: Diagnostic[]} {
    const normalized = names.map(name => name.replace(/\.\d{3}$/, ''));
    const diagnostics: Diagnostic[] = [];
    names.forEach((name, index) => {
        if (normalized.filter(candidate => candidate === normalized[index]).length > 1) {
            diagnostics.push({level: 'error', message: `Duplicate normalized name ${normalized[index]}: ${names.filter((_, i) => normalized[i] === normalized[index]).join(', ')}`});
        } else if (normalized[index] !== name) {
            diagnostics.push({level: 'warning', message: `Normalized Blender suffix: ${name} → ${normalized[index]}`});
        }
        if (name.includes(' ')) {
            diagnostics.push({level: 'warning', message: `Object name contains spaces: ${name}`});
        }
    });
    return {names: normalized, diagnostics};
}

export function matchTemplate(name: string, templates: Control[]): Control | undefined {
    const matches = templates.filter(template => name.startsWith(template.prefix ?? '\0'))
        .sort((a, b) => (b.prefix?.length ?? 0) - (a.prefix?.length ?? 0));
    if (matches.length > 1 && matches[0].prefix?.length === matches[1].prefix?.length) {
        throw new Error(`Equal template prefix lengths for ${name}`);
    }
    return matches[0];
}

export function stateId(name: string, control: Control): string {
    return control.stateId ?? (control.stateFrom === 'suffix' ? name.slice(control.prefix?.length ?? 0) : name);
}

export function canvasSource(name: string, keys: Set<string>, namespaces: Set<string>): string | undefined {
    const remainder = name.slice('canvas_'.length);
    const split = remainder.indexOf('_');
    const derived = split > 0 && namespaces.has(remainder.slice(0, split))
        ? remainder.slice(0, split) + '.' + remainder.slice(split + 1) : '';
    if (keys.has(remainder) && keys.has(derived)) {
        throw new Error(`Ambiguous canvas binding: ${name}; provide an explicit binding.`);
    }
    return keys.has(remainder) ? remainder : keys.has(derived) ? derived : undefined;
}

export function nearestControl(object: Object3D, controls: RegisteredControl[]): RegisteredControl | undefined {
    let current: Object3D | null = object;
    while (current) {
        const found = controls.find(control => control.object === current);
        if (found) {
            return found;
        }
        current = current.parent;
    }
    return undefined;
}

export function discover(root: Object3D, definition: DeviceDefinition): Registry {
    const nodes: Object3D[] = [];
    root.traverse(node => {
        if (node.name) {
            nodes.push(node);
        }
    });
    const normalized = normalizedNames(nodes.map(node => node.name));
    const registry: Registry = {objects: new Map(), controls: [], bindings: [], diagnostics: [...normalized.diagnostics]};
    if (normalized.diagnostics.some(item => item.level === 'error')) {
        return registry;
    }
    nodes.forEach((node, index) => {
        node.name = normalized.names[index];
        registry.objects.set(node.name, node);
    });
    const attempt = (callback: () => void) => {
        try {
            callback();
        } catch (error) {
            registry.diagnostics.push({level: 'error', message: String(error)});
        }
    };
    const walk = (node: Object3D, insideControl: boolean) => {
        let registered = false;
        const explicit = definition.objects?.[node.name];
        if (node.name && (!insideControl || explicit?.type)) {
            attempt(() => {
                const template = insideControl ? undefined : matchTemplate(node.name, definition.controlTemplates);
                const extras = node.userData['radionics'] ?? {};
                const override = definition.objects?.[node.name];
                if (template || extras.type || override?.type) {
                    const config: Control = validateControl({...template, ...extras, ...override});
                    if (!['knob', 'switch', 'button'].includes(config.type)) {
                        throw new Error(`Invalid control type on ${node.name}`);
                    }
                    if (config.type === 'knob') {
                        validateRange(config);
                    }
                    const id = stateId(node.name, config);
                    if (!/^[A-Za-z_][\w]*$/.test(id)) {
                        throw new Error(`Invalid state ID: ${id}`);
                    }
                    if (registry.controls.some(control => control.stateId === id)) {
                        throw new Error(`Duplicate control state ID: ${id}`);
                    }
                    registry.controls.push({object: node, config, stateId: id});
                    registered = true;
                }
            });
        }
        node.children.forEach(child => walk(child, insideControl || registered));
    };
    walk(root, false);
    const state: State = {...definition.initialState};
    registry.controls.forEach(control => state[control.stateId] ??= control.config.defaultValue
        ?? (control.config.type === 'knob' ? control.config.minValue ?? 0 : false));
    registry.controls.forEach(control => {
        const value = state[control.stateId];
        if (control.config.type === 'knob' ? typeof value !== 'number' || !Number.isFinite(value)
            || value < (control.config.minValue ?? 0) || value > (control.config.maxValue ?? 9) : typeof value !== 'boolean') {
            registry.diagnostics.push({level: 'error', message: `Invalid initial state for ${control.stateId}`});
        }
    });
    definition.rateGroups.forEach(group => {
        group.members.forEach(member => {
            if (!Object.hasOwn(state, member)) {
                registry.diagnostics.push({level: 'error', message: `Missing rate member ${member} in ${group.id}`});
            }
        });
        state[group.output] = '';
        state[`broadcast.${group.id}`] = '';
    });
    const keys = new Set(Object.keys(state));
    const namespaces = new Set([...keys].filter(key => key.includes('.')).map(key => key.split('.')[0]));
    nodes.forEach(node => attempt(() => {
        let binding = definition.bindings.find(item => item.object === node.name)
            ?? node.userData['binding'] as Binding | undefined;
        if (!binding && node.name.startsWith('canvas_')) {
            const source = canvasSource(node.name, keys, namespaces);
            if (source) {
                binding = {object: node.name, target: 'text', source};
            } else {
                registry.diagnostics.push({level: 'warning', message: `Unbound canvas: ${node.name}`});
            }
        }
        if (!binding && node.name.startsWith('led_')) {
            const source = node.name.slice(4);
            if (typeof state[source] === 'boolean') {
                binding = {object: node.name, target: 'led', source};
            } else {
                registry.diagnostics.push({level: 'warning', message: `Unbound LED: ${node.name}`});
            }
        }
        if (binding) {
            binding = validateBinding({...binding, object: node.name});
            if (binding.source && !/^[A-Za-z_][\w.]*$/.test(binding.source)) {
                throw new Error(`${node.name}: source is a state key; use when for expressions.`);
            }
            if (binding.source && !keys.has(binding.source)) {
                throw new Error(`${node.name}: missing state ${binding.source}`);
            }
            if (binding.target === 'text' && !binding.source) {
                throw new Error(`${node.name}: text requires source.`);
            }
            if (binding.when) {
                evaluate(binding.when, state);
            }
            registry.bindings.push({...binding, object: node.name});
        }
    }));
    definition.bindings.forEach(binding => {
        if (!registry.objects.has(binding.object)) {
            registry.diagnostics.push({level: 'error', message: `Binding object missing: ${binding.object}`});
        }
    });
    definition.broadcastSurfaces?.forEach(surface => attempt(() => {
        if (!registry.objects.has(surface.object) || !keys.has(surface.source)) {
            throw new Error(`Missing broadcast surface or source: ${surface.object} / ${surface.source}`);
        }
        if (surface.enabledWhen) {
            evaluate(surface.enabledWhen, state);
        }
    }));
    Object.keys(definition.objects ?? {}).forEach(name => {
        if (!registry.objects.has(name)) {
            registry.diagnostics.push({level: 'error', message: `Override object missing: ${name}`});
        }
    });
    return registry;
}

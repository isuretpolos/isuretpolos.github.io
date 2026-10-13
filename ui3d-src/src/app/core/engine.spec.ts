import {describe, expect, it} from 'vitest';
import {AnimationClip, Group, Mesh, NumberKeyframeTrack, PlaneGeometry} from 'three';
import demo from '../../../public/devices/classic-demo/device.json';
import {Control, DeviceDefinition} from '../models/device.types';
import {validateDefinition} from './validation';
import {angle, increment, snap, validateRange, valueAtAngle} from './control-mapping';
import {canvasSource, discover, matchTemplate, nearestControl, normalizedNames, stateId} from './naming';
import {evaluate} from './rules';
import {EventBus} from './event-bus';
import {DeviceState} from './device-state';
import {applyPreset, createPreset, Persistence, presetScope} from './persistence';
import {createDemo} from '../three/demo-device';
import {AnimationController} from '../three/animation-controller';
import {extractFrameBytes} from '../radionics/hotbits-provider';
import {DeviceLoader} from './device-loader';
import {controlAxis} from '../three/control-axis';
import 'fake-indexeddb/auto';
import {readFileSync} from 'node:fs';

const definition = (): DeviceDefinition => validateDefinition(demo);
const createStore = (bus = new EventBus()): DeviceState => {
    const config = definition();
    const registry = discover(createDemo(), config);
    expect(registry.diagnostics.filter(item => item.level === 'error')).toEqual([]);
    return new DeviceState(config, new Map(registry.controls.map(control => [control.stateId, control.config])), bus);
};
const knob: Control = {type: 'knob', minValue: 0, maxValue: 9, step: 1, minAngle: -135, maxAngle: 135};

describe('D1–D5 naming and validation', () => {
    it('normalizes a unique Blender suffix with a warning', () => {
        expect(normalizedNames(['knob10_1.001']).names).toEqual(['knob10_1']);
        expect(normalizedNames(['knob10_1.001']).diagnostics[0].level).toBe('warning');
    });
    it.each([['knob10_1', 'knob10_1.001'], ['knob10_1.001', 'knob10_1.002'], ['same', 'same']])('rejects collision %s / %s', (a, b) => {
        expect(normalizedNames([a, b]).diagnostics.some(item => item.level === 'error')).toBe(true);
    });
    it('is case-sensitive and warns on spaces', () => {
        expect(normalizedNames(['A', 'a']).diagnostics).toEqual([]);
        expect(normalizedNames(['bad name']).diagnostics[0].level).toBe('warning');
    });
    it('uses full names by default, suffix by template and explicit overrides', () => {
        expect(stateId('knob10_1', knob)).toBe('knob10_1');
        expect(stateId('switch_power', {type: 'switch', prefix: 'switch_', stateFrom: 'suffix'})).toBe('power');
        expect(stateId('switch_power', {type: 'switch', stateId: 'custom'})).toBe('custom');
    });
    it('selects longest prefix and rejects ties', () => {
        const templates: Control[] = [{type: 'knob', prefix: 'knob'}, {type: 'knob', prefix: 'knob10_'}];
        expect(matchTemplate('knob10_1', templates)?.prefix).toBe('knob10_');
        expect(() => matchTemplate('knob10_1', [...templates, templates[1]])).toThrow('Equal');
    });
    it('resolves canvas keys and only the first namespace separator', () => {
        const keys = new Set(['knob10_1', 'rate.main_group']);
        expect(canvasSource('canvas_knob10_1', keys, new Set(['rate']))).toBe('knob10_1');
        expect(canvasSource('canvas_rate_main_group', keys, new Set(['rate']))).toBe('rate.main_group');
        expect(canvasSource('canvas_missing', keys, new Set(['rate']))).toBeUndefined();
        expect(() => canvasSource('canvas_rate_main', new Set(['rate_main', 'rate.main']), new Set(['rate']))).toThrow('Ambiguous');
    });
    it('rejects expression sources with an actionable diagnostic', () => {
        const config = definition();
        config.bindings = [{object: 'led_broadcast', target: 'led', source: 'power && broadcast'}];
        expect(() => validateDefinition(config)).toThrow('when');
    });
    it('rejects nonexistent objects, states and duplicate state IDs', () => {
        const config = definition();
        config.bindings = [{object: 'missing', target: 'text', source: 'absent'}];
        expect(discover(createDemo(), config).diagnostics.some(item => item.message.includes('missing'))).toBe(true);
        config.objects = {knob10_1: {stateId: 'same'}, knob10_2: {stateId: 'same'}};
        expect(discover(createDemo(), config).diagnostics.some(item => item.message.includes('Duplicate control state'))).toBe(true);
    });
    it('honors JSON over extras over templates', () => {
        const root = createDemo();
        root.getObjectByName('knob10_1')!.userData['radionics'] = {maxValue: 8};
        const config = definition();
        config.objects = {knob10_1: {maxValue: 7}};
        expect(discover(root, config).controls.find(control => control.stateId === 'knob10_1')?.config.maxValue).toBe(7);
    });
    it('rejects malformed schema and unsafe asset paths', () => {
        expect(() => validateDefinition({})).toThrow('required');
        expect(() => validateDefinition({...demo, model: '../escape.glb'})).toThrow('within');
        expect(() => validateDefinition({...demo, unexpected: 1})).toThrow('additional');
    });
    it('validates Blender binding extras before activating them', () => {
        const root = createDemo();
        root.getObjectByName('canvas_knob10_1')!.userData['binding'] = {target: 'invalid', source: 'knob10_1'};
        expect(discover(root, definition()).diagnostics.some(item => item.level === 'error' && item.message.includes('allowed'))).toBe(true);
    });
});

describe('D6–D7 mappings and interaction values', () => {
    it('maps all 10 digit values to 30 degree steps', () => {
        for (let value = 0; value <= 9; value++) {
            expect(angle(value, knob)).toBeCloseTo(-135 + value * 30);
            expect(valueAtAngle(angle(value, knob), knob)).toBe(value);
        }
    });
    it('clamps, snaps and wraps input paths', () => {
        expect(snap(100, knob)).toBe(9);
        expect(snap(-10, knob)).toBe(0);
        expect(snap(5.7, knob)).toBe(6);
        expect(increment(9, 1, {...knob, wrap: true})).toBe(0);
        expect(increment(0, -1, {...knob, wrap: true})).toBe(9);
        expect(increment(9, 1, knob)).toBe(9);
    });
    it.each([{step: 0}, {step: 2}, {minAngle: 135}, {minValue: NaN}, {maxValue: 0}])('rejects invalid range %o', override => {
        expect(() => validateRange({...knob, ...override})).toThrow();
    });
});

describe('rules and state transitions', () => {
    it('parses comparisons, parentheses, precedence and boolean conditions', () => {
        expect(evaluate('power && (gv >= 5 || broadcast)', {power: true, gv: 6, broadcast: false})).toBe(true);
        expect(evaluate('!power || false', {power: false})).toBe(true);
        expect(() => evaluate('power && alert(1)', {power: true})).toThrow();
        expect(() => evaluate('power || missing', {power: true})).toThrow('Unknown');
    });
    it('composes ordered rates with leading zeros and no duplicate events', () => {
        const store = createStore();
        const events: string[] = [];
        store.bus.subscribe(store.instanceId, event => events.push(event.type));
        store.set('knob10_2', 5);
        store.set('knob10_3', 7);
        expect(store.state['rate.main']).toBe('0-5-7');
        const count = events.length;
        store.set('knob10_3', 7);
        expect(events.length).toBe(count);
        expect(events).toContain('rate.changed');
        expect(events).toContain('knob.changed');
    });
    it('freezes SNAPSHOT and updates LIVE', () => {
        const store = createStore();
        store.set('power', true);
        store.set('broadcast', true);
        store.set('knob10_1', 5);
        expect(store.state['broadcast.main']).toBe('0-0-0');
        expect(store.signatureChanged).toBe(true);
        expect(() => store.setMode('live')).toThrow('Stop');
        store.set('broadcast', false);
        store.setMode('live');
        store.set('broadcast', true);
        store.set('knob10_2', 7);
        expect(store.state['broadcast.main']).toBe('5-7-0');
    });
    it('initializes and resets a configured active snapshot session consistently', () => {
        const base = createStore();
        const config = definition();
        config.initialState['power'] = true;
        config.initialState['broadcast'] = true;
        const store = new DeviceState(config, base.controls, base.bus);
        expect(store.state['broadcast.main']).toBe('0-0-0');
        store.set('knob10_1', 5);
        expect(store.state['broadcast.main']).toBe('0-0-0');
        store.reset();
        expect(store.state['broadcast.main']).toBe('0-0-0');
        expect(() => store.set('knob10_1', true)).toThrow('numeric');
    });
    it('power off stops dependent functions, but preserves mechanical knobs', () => {
        const store = createStore();
        store.action('broadcast.start');
        expect(store.state['broadcast']).toBe(false);
        store.set('power', true);
        store.action('broadcast.start');
        store.set('diagnose', true);
        store.set('power', false);
        store.set('knob10_1', 5);
        expect(store.state['broadcast']).toBe(false);
        expect(store.state['diagnose']).toBe(false);
        expect(store.state['knob10_1']).toBe(5);
    });
});

describe('D10 persistence and D19 isolation', () => {
    it('isolates two instances and their events while sharing preset scope', () => {
        const bus = new EventBus();
        const first = createStore(bus);
        const second = createStore(bus);
        let otherEvents = 0;
        bus.subscribe(second.instanceId, () => otherEvents++);
        first.set('knob10_1', 5);
        expect(second.state['knob10_1']).toBe(0);
        expect(otherEvents).toBe(0);
        expect(first.instanceId).not.toBe(second.instanceId);
        expect(presetScope(first)).toBe(presetScope(second));
        applyPreset(second, createPreset(first));
        second.set('knob10_1', 7);
        expect(first.state['knob10_1']).toBe(5);
    });
    it('rejects device version, schema and dev hash mismatches', () => {
        const store = createStore();
        expect(() => applyPreset(store, createPreset(store, 'hash1'), 'hash2')).toThrow('another');
        expect(() => applyPreset(store, createPreset(store, 'hash1'))).toThrow('another');
        const preset = createPreset(store);
        const next = definition();
        next.device.version = '2.0.0';
        expect(() => applyPreset(new DeviceState(next, store.controls, store.bus), preset)).toThrow('another');
    });
    it('validates a whole preset before mutation and restores snapshots', () => {
        const store = createStore();
        const bad = createPreset(store);
        bad.values['knob10_1'] = 5;
        bad.values['knob10_2'] = 100;
        expect(() => applyPreset(store, bad)).toThrow('outside');
        expect(store.state['knob10_1']).toBe(0);
        store.set('power', true);
        store.set('broadcast', true);
        const preset = createPreset(store);
        store.reset();
        applyPreset(store, preset);
        expect(store.state['broadcast.main']).toBe('0-0-0');
    });
    it('round trips native IndexedDB', () => {
        const persistence = new Persistence();
        const store = createStore();
        store.set('knob10_1', 5);
        const preset = createPreset(store);
        return persistence.save(preset).then(() => persistence.load(preset.scope)).then(loaded => expect(loaded).toEqual(preset));
    });
});

describe('D16 hierarchy and animation lifecycle', () => {
    it('converts only exporter-baked local axes, leaving basis-parent procedural axes intact', () => {
        expect(controlAxis('Z', true).toArray()).toEqual([0, 1, 0]);
        expect(controlAxis('Y', true).toArray()).toEqual([0, 0, -1]);
        expect(controlAxis('Z', false).toArray()).toEqual([0, 0, 1]);
    });
    it('does not scan controls below a control, but keeps nested displays', () => {
        const root = createDemo();
        const knobObject = root.getObjectByName('knob10_1')!;
        const display = new Mesh(new PlaneGeometry(1, 1));
        display.name = 'canvas_power';
        knobObject.add(display);
        const registry = discover(root, definition());
        expect(registry.controls).toHaveLength(5);
        expect(nearestControl(root.getObjectByName('knob10_1_cap')!, registry.controls)?.object).toBe(knobObject);
        expect(registry.bindings.some(binding => binding.object === 'canvas_power')).toBe(true);
    });
    it('retains explicitly configured descendants without applying nested templates', () => {
        const config = definition();
        config.objects = {knob10_1_cap: {type: 'button', stateId: 'explicit_button', action: 'broadcast.start'}};
        const registry = discover(createDemo(), config);
        expect(registry.controls.find(control => control.stateId === 'explicit_button')?.config.type).toBe('button');
        expect(registry.controls.find(control => control.stateId === 'explicit_button')?.config.prefix).toBeUndefined();
    });
    it('rapid power toggles stop the loop and settle latest clip', () => {
        const root = new Group();
        const indicator = new Group();
        indicator.name = 'indicator';
        root.add(indicator);
        const base = createStore();
        const config = definition();
        config.animations = {power: {on: 'on', off: 'off', loop: 'loop'}};
        const store = new DeviceState(config, base.controls, base.bus);
        const clips = [
            new AnimationClip('on', 0.2, [new NumberKeyframeTrack('indicator.position[x]', [0, 0.2], [0, 1])]),
            new AnimationClip('off', 0.2, [new NumberKeyframeTrack('indicator.position[x]', [0, 0.2], [1, 0])]),
            new AnimationClip('loop', 0.2, [new NumberKeyframeTrack('indicator.position[x]', [0, 0.2], [1, 1])])
        ];
        const controller = new AnimationController(root, clips, store, [], []);
        for (let index = 0; index < 10; index++) {
            store.set('power', index % 2 === 0);
            controller.update(0.02);
        }
        for (let index = 0; index < 50; index++) {
            controller.update(0.02);
        }
        expect(store.state['power']).toBe(false);
        expect(indicator.position.x).toBeCloseTo(0);
        controller.destroy();
    });
});

describe('D18 imports and experimental frame sampling', () => {
    it('loads the actual Blender GLB through the runtime validator', () => {
        const loader = new DeviceLoader();
        const bytes = readFileSync(new URL('../../../public/devices/classic-demo/device.glb', import.meta.url));
        return loader.import([new File([JSON.stringify(demo)], 'device.json'), new File([bytes], 'device.glb')]).then(loaded => {
            expect(loaded.registry.controls).toHaveLength(5);
            expect(loaded.clips).toHaveLength(3);
            expect(loaded.contentHash).toMatch(/^[a-f0-9]{64}$/);
            expect(loaded.root.userData['blenderConvertedAxes']).toBe(true);
            expect(loaded.registry.diagnostics.filter(item => item.level === 'error')).toEqual([]);
        }).finally(() => loader.destroy());
    });
    it('rejects original GLB duplicate names even when Three.js sanitizes them', () => {
        const loader = new DeviceLoader();
        const bytes = readFileSync(new URL('../../../public/devices/classic-demo/device.glb', import.meta.url));
        const length = bytes.readUInt32LE(12);
        const json = JSON.parse(bytes.subarray(20, 20 + length).toString());
        json.nodes.find((node: {name: string}) => node.name === 'knob10_2').name = 'knob10_1.001';
        const text = JSON.stringify(json);
        const padded = Buffer.from(text + ' '.repeat((4 - Buffer.byteLength(text) % 4) % 4));
        const header = Buffer.from(bytes.subarray(0, 20));
        const tail = bytes.subarray(20 + length);
        header.writeUInt32LE(20 + padded.length + tail.length, 8);
        header.writeUInt32LE(padded.length, 12);
        const invalid = Buffer.concat([header, padded, tail]);
        return expect(loader.import([new File([JSON.stringify(demo)], 'device.json'), new File([invalid], 'device.glb')]))
            .rejects.toThrow('Duplicate normalized name').finally(() => loader.destroy());
    });
    it('rejects wrong pairs and malformed GLB without an active replacement', () => {
        const loader = new DeviceLoader();
        return expect(loader.import([new File(['{}'], 'device.json')])).rejects.toThrow('exactly')
            .then(() => expect(loader.import([new File([JSON.stringify(demo)], 'device.json'), new File(['invalid'], 'model.glb')])).rejects.toThrow('header'))
            .finally(() => loader.destroy());
    });
    it('uses frame-sum comparisons and rejects insufficient difference', () => {
        const first = new Uint8ClampedArray(64 * 64 * 4).fill(200);
        const second = new Uint8ClampedArray(64 * 64 * 4).fill(100);
        expect(extractFrameBytes(first, second)[0]).toBe(255);
        expect(extractFrameBytes(first, first)).toEqual([]);
    });
});

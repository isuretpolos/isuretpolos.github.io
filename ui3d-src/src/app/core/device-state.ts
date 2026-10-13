import {Control, DeviceDefinition, State, Value} from '../models/device.types';
import {EventBus} from './event-bus';
import {snap} from './control-mapping';

let instanceCounter = 0;
export class DeviceState {
    readonly instanceId = `device-${++instanceCounter}`;
    readonly definition: DeviceDefinition;
    private values: State;
    private frozen: Record<string, string> = {};
    mode: 'snapshot' | 'live';

    constructor(definition: DeviceDefinition, readonly controls: Map<string, Control>, readonly bus: EventBus) {
        this.definition = freezeDefinition(structuredClone(definition));
        this.mode = definition.broadcast.rateMode;
        this.values = this.defaults();
        this.derive();
        this.captureInitialSession();
    }

    get state(): Readonly<State> {
        return Object.freeze({...this.values});
    }

    get snapshot(): Readonly<Record<string, string>> {
        return Object.freeze({...this.frozen});
    }

    get signatureChanged(): boolean {
        return this.definition.rateGroups.some(group => this.frozen[group.id] !== this.values[group.output]);
    }

    set(key: string, value: Value): void {
        if (typeof value === 'number' && !Number.isFinite(value)) {
            throw new Error('State numbers must be finite.');
        }
        if (!Object.hasOwn(this.values, key) || key.includes('.')) {
            throw new Error(`Unknown or derived state: ${key}`);
        }
        const control = this.controls.get(key);
        if (control?.type === 'knob') {
            if (typeof value !== 'number') {
                throw new Error(`Knob ${key} requires a numeric value.`);
            }
            value = snap(value, control);
        } else if (typeof value !== typeof this.values[key]) {
            throw new Error(`Wrong value type for ${key}`);
        }
        if ((key === 'broadcast' || key === 'diagnose') && !this.values['power']) {
            value = false;
        }
        if (this.values[key] === value) {
            return;
        }
        const previous = {...this.values};
        this.values[key] = value;
        if (key === 'power' && !value) {
            this.values['broadcast'] = false;
            this.values['diagnose'] = false;
        }
        this.derive();
        if (!previous['broadcast'] && this.values['broadcast']) {
            this.frozen = Object.fromEntries(this.definition.rateGroups.map(group => [group.id, String(this.values[group.output])]));
        }
        this.derive();
        Object.keys(this.values).forEach(changed => {
            if (previous[changed] !== this.values[changed]) {
                let type = changed.startsWith('rate.') ? 'rate.changed' : `${changed}.changed`;
                if (changed === 'broadcast') {
                    type = this.values[changed] ? 'broadcast.started' : 'broadcast.stopped';
                } else if (this.controls.get(changed)?.type === 'knob') {
                    type = 'knob.changed';
                }
                this.bus.emit({instanceId: this.instanceId, type, key: changed, state: this.state});
            }
        });
    }

    action(name: string, pressed = true): void {
        this.bus.emit({instanceId: this.instanceId, type: `action.${name}.${pressed ? 'press' : 'release'}`, state: this.state});
        if (!pressed) {
            return;
        }
        const [key, operation] = name.split('.');
        if (['broadcast', 'diagnose', 'power'].includes(key) && Object.hasOwn(this.values, key)) {
            this.set(key, operation === 'toggle' ? !this.values[key] : operation === 'start');
        }
    }

    setMode(mode: 'snapshot' | 'live'): void {
        if (this.values['broadcast']) {
            throw new Error('Stop broadcast before changing mode.');
        }
        this.mode = mode;
        this.derive();
        this.notify();
    }

    reset(): void {
        this.values = this.defaults();
        this.frozen = {};
        this.mode = this.definition.broadcast.rateMode;
        this.derive();
        this.captureInitialSession();
        this.notify();
    }

    restore(values: State, mode: 'snapshot' | 'live', frozen: Record<string, string>): void {
        // Validate the complete preset before changing this instance.
        const defaults = this.defaults();
        Object.entries(values).forEach(([key, value]) => {
            if (!Object.hasOwn(defaults, key) || typeof defaults[key] !== typeof value) {
                throw new Error(`Invalid preset state: ${key}`);
            }
            if (typeof value === 'number' && !Number.isFinite(value)) {
                throw new Error(`Invalid preset number: ${key}`);
            }
            const control = this.controls.get(key);
            if (control?.type === 'knob' && snap(Number(value), control) !== value) {
                throw new Error(`Preset value outside range: ${key}`);
            }
        });
        if (!['live', 'snapshot'].includes(mode) || Object.values(frozen).some(value => typeof value !== 'string')) {
            throw new Error('Invalid broadcast preset.');
        }
        const groups = new Set(this.definition.rateGroups.map(group => group.id));
        if (Object.keys(frozen).some(key => !groups.has(key))
            || (mode === 'snapshot' && values['broadcast'] && [...groups].some(key => !Object.hasOwn(frozen, key)))) {
            throw new Error('Preset snapshot does not match this device rate groups.');
        }
        this.values = {...defaults, ...values};
        this.mode = mode;
        this.frozen = {...frozen};
        if (!this.values['power']) {
            this.values['broadcast'] = false;
            this.values['diagnose'] = false;
        }
        this.derive();
        this.notify();
    }

    presetValues(): State {
        return Object.fromEntries(Object.entries(this.values).filter(([key]) => !key.includes('.')));
    }

    private defaults(): State {
        const values: State = {...this.definition.initialState};
        this.controls.forEach((control, key) => {
            values[key] ??= control.defaultValue ?? (control.type === 'knob' ? control.minValue ?? 0 : false);
        });
        if (!values['power']) {
            values['broadcast'] = false;
            values['diagnose'] = false;
        }
        return values;
    }

    private derive(): void {
        this.definition.rateGroups.forEach(group => {
            this.values[group.output] = group.members.map(key => this.values[key]).join(group.separator);
            this.values[`broadcast.${group.id}`] = this.mode === 'live'
                ? this.values[group.output] : this.frozen[group.id] ?? '';
        });
    }

    private captureInitialSession(): void {
        if (this.values['broadcast'] && Object.keys(this.frozen).length === 0) {
            this.frozen = Object.fromEntries(this.definition.rateGroups.map(group => [group.id, String(this.values[group.output])]));
            this.derive();
        }
    }

    private notify(): void {
        this.bus.emit({instanceId: this.instanceId, type: 'state.restored', state: this.state});
    }
}

function freezeDefinition<T>(value: T): T {
    if (value && typeof value === 'object') {
        Object.values(value).forEach(item => freezeDefinition(item));
        Object.freeze(value);
    }
    return value;
}

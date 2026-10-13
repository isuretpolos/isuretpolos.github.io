import {DeviceState} from './device-state';
import {State} from '../models/device.types';

export interface Preset {scope: string; values: State; mode: 'snapshot' | 'live'; snapshot: Record<string, string>;}

export function presetScope(store: DeviceState, hash?: string): string {
    const definition = store.definition;
    return JSON.stringify([hash ? 'dev' : 'library', definition.device.id, definition.device.version, definition.schemaVersion, hash ?? '']);
}

export function createPreset(store: DeviceState, hash?: string): Preset {
    return {scope: presetScope(store, hash), values: store.presetValues(), mode: store.mode, snapshot: {...store.snapshot}};
}

export function applyPreset(store: DeviceState, value: unknown, hash?: string): void {
    if (!value || typeof value !== 'object') {
        throw new Error('Invalid preset JSON.');
    }
    const preset = value as Preset;
    if (preset.scope !== presetScope(store, hash)) {
        throw new Error('Preset belongs to another device version or import. Use Reset for current defaults.');
    }
    if (!preset.values || typeof preset.values !== 'object' || Array.isArray(preset.values)
        || !preset.snapshot || typeof preset.snapshot !== 'object' || Array.isArray(preset.snapshot)) {
        throw new Error('Preset requires values and snapshot objects.');
    }
    store.restore(preset.values, preset.mode, preset.snapshot);
}

export class Persistence {
    private open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('radionics-ui3d', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('presets');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('IndexedDB update blocked by another tab.'));
        });
    }

    save(preset: Preset): Promise<void> {
        return this.open().then(database => new Promise<void>((resolve, reject) => {
            const transaction = database.transaction('presets', 'readwrite');
            transaction.objectStore('presets').put(preset, preset.scope);
            transaction.oncomplete = () => {database.close(); resolve();};
            transaction.onerror = () => {database.close(); reject(transaction.error);};
            transaction.onabort = () => {database.close(); reject(transaction.error);};
        }));
    }

    load(scope: string): Promise<Preset> {
        return this.open().then(database => new Promise<Preset>((resolve, reject) => {
            const request = database.transaction('presets').objectStore('presets').get(scope);
            request.onsuccess = () => {
                database.close();
                if (!request.result) {
                    reject(new Error('No preset for this device version/import. Use Reset or save a new preset.'));
                } else {
                    resolve(request.result);
                }
            };
            request.onerror = () => {database.close(); reject(request.error);};
        }));
    }
}

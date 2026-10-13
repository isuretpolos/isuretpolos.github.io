import {State} from '../models/device.types';

export interface DeviceEvent {instanceId: string; type: string; state: Readonly<State>; key?: string;}
export class EventBus {
    private readonly listeners = new Set<(event: DeviceEvent) => void>();

    subscribe(instanceId: string, listener: (event: DeviceEvent) => void): () => void {
        const filtered = (event: DeviceEvent) => {
            if (event.instanceId === instanceId) {
                listener(event);
            }
        };
        this.listeners.add(filtered);
        return () => this.listeners.delete(filtered);
    }

    emit(event: DeviceEvent): void {
        this.listeners.forEach(listener => listener(event));
    }
}

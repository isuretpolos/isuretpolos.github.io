import { Injectable, inject } from '@angular/core';
import { HotbitStore } from './hotbit-store';
import { HotbitsConnectionService } from './hotbits-connection';

export interface HotbitsSource {
    readonly label: string;
    availableBytes(): Promise<number>;
}

@Injectable({ providedIn: 'root' })
export class LocalHotbitsSource implements HotbitsSource {
    readonly label = 'Local camera / store';
    private readonly store = inject(HotbitStore);

    availableBytes(): Promise<number> {
        return this.store.counts().then((counts) => counts.available * 4);
    }
}

@Injectable({ providedIn: 'root' })
export class AetherOnePiRemoteSource implements HotbitsSource {
    readonly label = 'AetherOnePi via LAN';
    private readonly connection = inject(HotbitsConnectionService);

    availableBytes(): Promise<number> {
        return this.connection.refresh().then((status) => status.availableBytes);
    }
}

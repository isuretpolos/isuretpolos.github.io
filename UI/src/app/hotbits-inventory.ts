import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { LocalHotbitsSource, AetherOnePiRemoteSource } from './hotbits-source';
import { HotbitStore } from './hotbit-store';
import { HotbitsConnectionService } from './hotbits-connection';

interface Transfer {
    remoteRequest: string;
    endpoint: string;
    countBytes: number;
    allocationId?: string;
    sha256?: string;
    downloadUrl?: string;
    imported?: boolean;
    acknowledged?: boolean;
}
@Injectable({ providedIn: 'root' })
export class HotbitsInventoryService {
    readonly sources = [inject(LocalHotbitsSource), inject(AetherOnePiRemoteSource)];
    readonly store = inject(HotbitStore);
    readonly connection = inject(HotbitsConnectionService);
    readonly availableBytes = signal(0);
    readonly busy = signal(false);
    readonly error = signal('');
    autoRefill = false;
    targetBytes = 100000;
    lowWatermark = 12500;
    batchBytes = 12500;
    ceilingBytes = 4000000;
    source = 'local';
    private stopped = false;

    constructor() {
        const active = () => {
            if (document.hidden) {
                this.cancel();
                return;
            }
            this.refreshLocal()
                .then(() => {
                    if (
                        this.autoRefill &&
                        this.source === 'remote' &&
                        this.connection.connected() &&
                        navigator.onLine &&
                        this.availableBytes() < this.lowWatermark
                    ) {
                        return this.refill();
                    }
                    return undefined;
                })
                .catch((error) => this.report(error));
        };
        const timer = setInterval(active, 15000);
        document.addEventListener('visibilitychange', active);
        inject(DestroyRef).onDestroy(() => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', active);
            this.cancel();
        });
        this.refreshLocal().catch((error) => this.report(error));
        if (this.connection.connected() && navigator.onLine && !document.hidden) {
            this.refill(false).catch(() => {});
        }
    }

    refreshLocal(): Promise<void> {
        return this.sources[0].availableBytes().then((bytes) => this.availableBytes.set(bytes));
    }

    cancel(): void {
        this.stopped = true;
        this.connection.cancel();
    }

    refill(create = true): Promise<void> {
        if (this.busy()) {
            return Promise.resolve();
        }
        if (
            ![this.targetBytes, this.lowWatermark, this.batchBytes, this.ceilingBytes].every(
                (value) => Number.isSafeInteger(value) && value > 0,
            ) ||
            this.lowWatermark > this.targetBytes ||
            this.targetBytes > this.ceilingBytes ||
            this.ceilingBytes > 16000000
        ) {
            return Promise.reject(
                new Error('Use positive integer bytes: low watermark ≤ target ≤ ceiling ≤ 16000000.'),
            );
        }
        this.busy.set(true);
        this.stopped = false;
        this.connection.cancel();
        this.error.set('');
        const work = () =>
            this.store.remoteRecords<Transfer>().then((records) => {
                const pending = records.filter(
                    (record) => record.endpoint === this.connection.endpoint() && !record.acknowledged,
                );
                // ACKs precede pending downloads. The same durable request ID is used on every retry.
                pending.sort((a, b) => Number(!!b.imported) - Number(!!a.imported));
                return pending.reduce((chain, record) => chain.then(() => this.transfer(record)), Promise.resolve());
            });
        const next = (): Promise<void> => {
            this.checkActive();
            return this.refreshLocal().then(() => {
                if (!create || this.availableBytes() >= this.targetBytes) {
                    return;
                }
                return this.connection.refresh().then((status) => {
                    const countBytes = Math.min(
                        this.batchBytes,
                        status.maxBatchBytes,
                        status.availableBytes,
                        this.targetBytes - this.availableBytes(),
                        this.ceilingBytes - this.availableBytes(),
                    );
                    if (countBytes < 1) {
                        throw new Error('Insufficient remote inventory.');
                    }
                    const record: Transfer = {
                        remoteRequest: crypto.randomUUID(),
                        endpoint: this.connection.endpoint(),
                        countBytes,
                    };
                    return this.store
                        .saveRemote(record)
                        .then(() => this.transfer(record))
                        .then(next);
                });
            });
        };
        // Web Locks serialize refill across tabs; IndexedDB additionally prevents duplicate imports.
        const run = () => work().then(next);
        const operation = navigator.locks ? navigator.locks.request('radionics.remote-refill', run) : run();
        return operation
            .catch((error) => {
                this.report(error);
                throw error;
            })
            .finally(() => {
                this.busy.set(false);
                this.refreshLocal().catch((error) => this.report(error));
            });
    }

    private transfer(record: Transfer): Promise<void> {
        this.checkActive();
        const allocate = record.allocationId
            ? Promise.resolve()
            : this.connection
                  .api<{ allocationId: string; countBytes: number; sha256: string; downloadUrl: string }>(
                      '/allocations',
                      { requestId: record.remoteRequest, countBytes: record.countBytes },
                  )
                  .then((result) => {
                      if (result.countBytes !== record.countBytes || !/^[a-fA-F0-9]{64}$/.test(result.sha256)) {
                          throw new Error('Invalid allocation metadata.');
                      }
                      Object.assign(record, result);
                      return this.store.saveRemote(record);
                  });
        return allocate
            .then(() => {
                this.checkActive();
                if (record.imported) {
                    return;
                }
                return this.connection.download(record.downloadUrl!, record.allocationId!).then((buffer) => {
                    if (buffer.byteLength !== record.countBytes) {
                        throw new Error('Hotbit byte count mismatch.');
                    }
                    return crypto.subtle.digest('SHA-256', buffer).then((hash) => {
                        const hex = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(
                            '',
                        );
                        if (hex !== record.sha256!.toLowerCase()) {
                            throw new Error('Hotbit SHA-256 mismatch.');
                        }
                        this.checkActive();
                        return this.store.importRemote(record, new Uint8Array(buffer), this.ceilingBytes).then(() => {
                            record.imported = true;
                        });
                    });
                });
            })
            .then(() => {
                this.checkActive();
                return this.connection.api(`/allocations/${record.allocationId}/ack`, {}).then(() => {
                    record.acknowledged = true;
                    return this.store.saveRemote(record);
                });
            });
    }

    private checkActive(): void {
        if (this.stopped || document.hidden || !navigator.onLine) {
            throw new Error('Transfer paused. Retry when online and active.');
        }
    }
    private report(error: unknown): void {
        this.error.set(error instanceof Error ? error.message : 'Hotbit transfer failed.');
    }
}

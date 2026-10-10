import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable()
export class BroadcastWakeLock {
    readonly active = signal(false);
    readonly message = signal('');
    private wanted = false;
    private pending = false;
    private generation = 0;
    private lock?: WakeLockSentinel;

    constructor() {
        const visibility = () => {
            if (document.hidden) {
                this.release();
            } else {
                this.acquire();
            }
        };
        document.addEventListener('visibilitychange', visibility);
        inject(DestroyRef).onDestroy(() => {
            this.wanted = false;
            this.release();
            document.removeEventListener('visibilitychange', visibility);
        });
    }

    setEnabled(enabled: boolean): void {
        this.wanted = enabled;
        if (enabled) {
            this.acquire();
        } else {
            this.release();
            this.message.set('');
        }
    }

    private acquire(): void {
        if (!this.wanted || document.hidden || this.pending || this.lock) {
            return;
        }
        if (!navigator.wakeLock) {
            this.message.set('This browser cannot keep the screen awake automatically.');
            return;
        }
        const token = ++this.generation;
        this.pending = true;
        navigator.wakeLock
            .request('screen')
            .then((lock) => {
                if (token !== this.generation || !this.wanted || document.hidden) {
                    lock.release().catch(() => {});
                    return;
                }
                this.lock = lock;
                this.active.set(true);
                this.message.set('Screen stays awake while this activity is running.');
                lock.addEventListener('release', () => {
                    if (this.lock === lock) {
                        this.lock = undefined;
                        this.active.set(false);
                        this.message.set('Screen wake lock was released by the device.');
                    }
                });
            })
            .catch(() => {
                if (token === this.generation) {
                    this.message.set('The device declined the screen wake lock; the screen may sleep.');
                }
            })
            .finally(() => {
                if (token === this.generation) {
                    this.pending = false;
                }
            });
    }

    private release(): void {
        ++this.generation;
        this.pending = false;
        const lock = this.lock;
        this.lock = undefined;
        this.active.set(false);
        lock?.release().catch(() => {});
    }
}

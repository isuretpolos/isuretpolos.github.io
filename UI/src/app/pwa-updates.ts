import { DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

export const RELOAD_APPLICATION = new InjectionToken<() => void>('Reload application', {
    providedIn: 'root',
    factory: () => () => window.location.reload(),
});

@Injectable({ providedIn: 'root' })
export class PwaUpdates {
    private readonly worker = inject(SwUpdate, { optional: true });
    private readonly reloadPage = inject(RELOAD_APPLICATION);
    readonly ready = signal(false);
    readonly checkError = signal('');
    readonly enabled = this.worker?.isEnabled ?? false;
    private checking = false;

    constructor() {
        if (!this.enabled) {
            return;
        }
        const subscription = this.worker!.versionUpdates.subscribe((event) => {
            if (event.type === 'VERSION_READY') {
                this.ready.set(true);
            }
        });
        const foreground = () => {
            if (document.visibilityState === 'visible') {
                this.check();
            }
        };
        document.addEventListener('visibilitychange', foreground);
        inject(DestroyRef).onDestroy(() => {
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', foreground);
        });
        this.check();
    }

    check(): void {
        if (!this.enabled || this.checking) {
            return;
        }
        this.checking = true;
        this.worker!.checkForUpdate()
            .then(() => this.checkError.set(''))
            .catch(() => {
                // Offline checks may fail; keep the installed app and retry on the next foreground event.
                this.checkError.set('Update check unavailable. It will retry when the app returns to the foreground.');
            })
            .finally(() => (this.checking = false));
    }

    reload(): void {
        if (this.ready()) {
            // Reload as one complete version instead of activating new assets in the running application.
            this.reloadPage();
        }
    }
}

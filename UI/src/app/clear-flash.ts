import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClearFlash {
    readonly active = signal(false);
    private timer?: ReturnType<typeof setTimeout>;

    constructor() {
        inject(DestroyRef).onDestroy(() => this.finish());
    }

    start(): void {
        if (this.active()) {
            return;
        }
        this.active.set(true);
        document.documentElement.classList.add('purple-clearing');
        this.timer = setTimeout(() => this.finish(), 4000);
    }

    private finish(): void {
        clearTimeout(this.timer);
        document.documentElement.classList.remove('purple-clearing');
        this.active.set(false);
    }
}

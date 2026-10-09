import { DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Fullscreen {
    readonly target = signal<HTMLElement | null>(null);
    readonly error = signal('');
    private fallback?: HTMLElement;

    constructor() {
        const sync = () => this.target.set(document.fullscreenElement as HTMLElement | null);
        document.addEventListener('fullscreenchange', sync);
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && this.fallback) {
                this.exit();
            }
        };
        document.addEventListener('keydown', escape);
        inject(DestroyRef).onDestroy(() => {
            document.removeEventListener('fullscreenchange', sync);
            document.removeEventListener('keydown', escape);
            this.fallback?.classList.remove('fullscreen-fallback');
        });
    }

    toggle(element: HTMLElement = document.documentElement): void {
        this.error.set('');
        if (this.target()) {
            this.exit();
            return;
        }
        if (!element.requestFullscreen) {
            this.fallback = element;
            element.classList.add('fullscreen-fallback');
            this.target.set(element);
            this.error.set(
                'Browser fullscreen is unavailable; using an expanded view. System controls may remain visible.',
            );
            return;
        }
        element
            .requestFullscreen()
            .catch(() =>
                this.error.set('Fullscreen request was declined. Please try again from the fullscreen button.'),
            );
    }

    exit(): void {
        if (this.fallback) {
            this.fallback.classList.remove('fullscreen-fallback');
            this.fallback = undefined;
            this.target.set(null);
        } else if (document.fullscreenElement) {
            document
                .exitFullscreen()
                .catch(() => this.error.set('Could not exit fullscreen. Use the browser fullscreen controls.'));
        }
    }
}

import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';

interface InstallPrompt extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
    selector: 'app-pwa-install',
    templateUrl: './pwa-install.html',
    styleUrl: './pwa-install.css',
})
export class PwaInstall {
    readonly installed = signal(false);
    readonly canInstall = signal(false);
    readonly busy = signal(false);
    readonly error = signal('');
    private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('installDialog');
    private pendingPrompt?: InstallPrompt;
    private readonly displayMode = window.matchMedia?.('(display-mode: standalone), (display-mode: minimal-ui)');

    constructor() {
        const updateMode = () => {
            const standalone = (navigator as Navigator & { standalone?: boolean }).standalone;
            this.installed.set(this.displayMode?.matches === true || standalone === true);
            if (this.installed()) {
                this.close();
            }
        };
        const beforeInstall = (event: Event) => {
            event.preventDefault();
            this.pendingPrompt = event as InstallPrompt;
            this.canInstall.set(true);
        };
        const installed = () => {
            this.close();
            this.installed.set(true);
            this.pendingPrompt = undefined;
            this.canInstall.set(false);
        };
        updateMode();
        window.addEventListener('beforeinstallprompt', beforeInstall);
        window.addEventListener('appinstalled', installed);
        this.displayMode?.addEventListener('change', updateMode);
        inject(DestroyRef).onDestroy(() => {
            window.removeEventListener('beforeinstallprompt', beforeInstall);
            window.removeEventListener('appinstalled', installed);
            this.displayMode?.removeEventListener('change', updateMode);
        });
        afterNextRender(() => {
            if (this.installed()) {
                return;
            }
            try {
                if (localStorage.getItem('radionics.install-offer-seen')) {
                    return;
                }
                localStorage.setItem('radionics.install-offer-seen', 'true');
            } catch {
                // The offer still works when browser preference storage is unavailable.
            }
            this.open();
        });
    }

    open(): void {
        if (!this.installed()) {
            this.dialog()?.nativeElement.showModal();
        }
    }

    close(): void {
        this.dialog()?.nativeElement.close();
    }

    install(): void {
        const prompt = this.pendingPrompt;
        if (!prompt || this.busy() || this.installed()) {
            return;
        }
        this.pendingPrompt = undefined;
        this.canInstall.set(false);
        this.busy.set(true);
        this.error.set('');
        prompt
            .prompt()
            .then(() => prompt.userChoice)
            .then(() => this.close())
            .catch(() => this.error.set('Installation could not start. Try the install option in your browser menu.'))
            .finally(() => this.busy.set(false));
    }
}

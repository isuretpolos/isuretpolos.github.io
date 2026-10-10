import { TestBed } from '@angular/core/testing';
import { PwaInstall } from './pwa-install';

describe('PWA install offer', () => {
    let mode: EventTarget & { matches: boolean };
    let show: ReturnType<typeof vi.fn<() => void>>;

    beforeEach(() => {
        localStorage.clear();
        mode = Object.assign(new EventTarget(), { matches: false });
        vi.stubGlobal('matchMedia', () => mode);
        show = vi.fn();
        Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: show });
        Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: vi.fn() });
        TestBed.configureTestingModule({ imports: [PwaInstall] });
    });

    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('offers installation once and keeps the browser button available', () => {
        const first = TestBed.createComponent(PwaInstall);
        first.detectChanges();
        expect(show).toHaveBeenCalledOnce();
        first.destroy();
        const second = TestBed.createComponent(PwaInstall);
        second.detectChanges();
        expect(show).toHaveBeenCalledOnce();
        expect(second.nativeElement.textContent).toContain('Install app');
        second.componentInstance.open();
        expect(show).toHaveBeenCalledTimes(2);
    });

    it('hides the offer and button when launched as an installed app', () => {
        mode.matches = true;
        const fixture = TestBed.createComponent(PwaInstall);
        fixture.detectChanges();
        expect(show).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });

    it('uses the browser prompt once and hides controls after installation', () => {
        const fixture = TestBed.createComponent(PwaInstall);
        fixture.detectChanges();
        const prompt = vi.fn().mockResolvedValue(undefined);
        const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
            prompt,
            userChoice: Promise.resolve({ outcome: 'accepted' }),
        });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        fixture.componentInstance.install();
        fixture.componentInstance.install();
        expect(prompt).toHaveBeenCalledOnce();
        window.dispatchEvent(new Event('appinstalled'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
        return fixture.whenStable();
    });

    it('responds to a change into standalone mode', () => {
        const fixture = TestBed.createComponent(PwaInstall);
        fixture.detectChanges();
        mode.matches = true;
        mode.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });
});

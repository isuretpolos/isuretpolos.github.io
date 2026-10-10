import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BroadcastPanel } from './broadcast-panel';
import { HotbitStore } from './hotbit-store';

const rates = [
    { name: 'First', originalIndex: 0, gv: 800, energeticScore: 70 },
    { name: 'Second', originalIndex: 1, gv: 600, energeticScore: 60 },
];

describe('Canvas broadcaster', () => {
    it('broadcasts a typed custom signature without analysis and opens the fullscreen stage', () => {
        const fixture = TestBed.createComponent(BroadcastPanel);
        fixture.componentRef.setInput('targetGv', 500);
        fixture.detectChanges();
        const panel = fixture.componentInstance;
        vi.spyOn(panel as any, 'tick').mockImplementation(() => {});
        panel.customRate = '  Custom intention  ';
        panel.startCustom();
        expect(panel.session().map((rate) => rate.name)).toEqual(['Custom intention']);
        expect(panel.immersive()).toBe(true);
        expect(document.body.style.overflow).toBe('hidden');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.broadcast-stage.immersive')).toBeTruthy();
        panel.stop();
        expect(panel.immersive()).toBe(true);
        panel.closeStage();
        expect(document.body.style.overflow).not.toBe('hidden');
        fixture.destroy();
    });

    it('requests fullscreen with hidden navigation and restores the workspace on Escape', () => {
        const fixture = TestBed.createComponent(BroadcastPanel);
        fixture.detectChanges();
        const stage = fixture.nativeElement.querySelector('.broadcast-stage') as HTMLElement;
        const request = vi.fn().mockResolvedValue(undefined);
        stage.requestFullscreen = request;
        fixture.componentInstance.openStage();
        expect(request).toHaveBeenCalledWith({ navigationUI: 'hide' });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(fixture.componentInstance.immersive()).toBe(false);
        fixture.destroy();
    });

    it('repeats for ten seconds below baseline and finishes when GV reaches it', () => {
        const hotbits = { targetMeasurement: vi.fn().mockResolvedValueOnce(400).mockResolvedValueOnce(500) };
        TestBed.configureTestingModule({ providers: [{ provide: HotbitStore, useValue: hotbits }] });
        const fixture = TestBed.createComponent(BroadcastPanel);
        const panel = fixture.componentInstance;
        const state = panel as any;
        state.baseline = 500;
        state.checkEnabled = true;
        panel.running.set(true);
        const tick = vi.spyOn(state, 'tick').mockImplementation(() => {});
        state.finishCycle(0);
        return Promise.resolve()
            .then(() => {
                expect(panel.duration()).toBe(10);
                expect(panel.cycles()).toBe(2);
                expect(panel.running()).toBe(true);
                expect(tick).toHaveBeenCalledWith(0);
                state.finishCycle(0);
                return Promise.resolve();
            })
            .then(() => {
                expect(panel.running()).toBe(false);
                expect(panel.lastGv()).toBe(500);
                expect(panel.status()).toContain('target GV reached');
                fixture.destroy();
            });
    });

    it('broadcasts selected rows and preserves resonance counts after stopping', () => {
        const hotbits = { broadcastResonance: vi.fn().mockResolvedValue([true]) };
        TestBed.configureTestingModule({ providers: [{ provide: HotbitStore, useValue: hotbits }] });
        const fixture = TestBed.createComponent(BroadcastPanel);
        fixture.componentRef.setInput('results', rates);
        fixture.componentRef.setInput('targetGv', 500);
        fixture.detectChanges();
        const panel = fixture.componentInstance;
        vi.spyOn(panel as any, 'draw').mockImplementation(() => {});
        panel.toggle(1);
        panel.start();
        return Promise.resolve().then(() => {
            expect(panel.session().map((rate) => rate.name)).toEqual(['Second']);
            expect(panel.total()).toBe(1);
            panel.stop();
            expect(panel.running()).toBe(false);
            expect(panel.total()).toBe(1);
            fixture.destroy();
        });
    });

    it('does not record late resonance results after cancellation', () => {
        let resolve!: (hits: boolean[]) => void;
        const hotbits = { broadcastResonance: () => new Promise<boolean[]>((done) => (resolve = done)) };
        TestBed.configureTestingModule({ providers: [{ provide: HotbitStore, useValue: hotbits }] });
        const fixture = TestBed.createComponent(BroadcastPanel);
        fixture.componentRef.setInput('results', rates);
        fixture.componentRef.setInput('targetGv', 500);
        fixture.detectChanges();
        const panel = fixture.componentInstance;
        panel.start(true);
        panel.stop();
        resolve([true, true]);
        return Promise.resolve().then(() => {
            expect(panel.session().length).toBe(2);
            expect(panel.total()).toBe(0);
            fixture.destroy();
        });
    });
});

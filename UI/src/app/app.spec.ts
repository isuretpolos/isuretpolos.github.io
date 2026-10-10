import { HotbitStore } from './hotbit-store';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('Rate workspace', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            imports: [App],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
    });

    it('keeps the screen awake during collection and releases only its own lock on stop', () => {
        const lock = Object.assign(new EventTarget(), { release: vi.fn().mockResolvedValue(undefined) });
        const request = vi.fn().mockResolvedValue(lock);
        const original = Object.getOwnPropertyDescriptor(navigator, 'wakeLock');
        Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/version.json').flush({ version: '1.0.0', description: 'First version' });
        http.expectOne('/RATES/index.json').flush([]);
        app.camera.collecting.set(true);
        fixture.detectChanges();
        return Promise.resolve()
            .then(() => {
                expect(request).toHaveBeenCalledWith('screen');
                expect(app.collectionWakeLock.active()).toBe(true);
                app.camera.collecting.set(false);
                fixture.detectChanges();
                expect(lock.release).toHaveBeenCalledTimes(1);
                expect(app.collectionWakeLock.active()).toBe(false);
            })
            .finally(() => {
                fixture.destroy();
                if (original) {
                    Object.defineProperty(navigator, 'wakeLock', original);
                } else {
                    Reflect.deleteProperty(navigator, 'wakeLock');
                }
            });
    });
    it('enables analysis and fills progress as soon as the minimum count is available', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        TestBed.inject(HttpTestingController)
            .expectOne('/version.json')
            .flush({ version: '1.0.0', description: 'First version' });
        TestBed.inject(HttpTestingController).expectOne('/RATES/index.json').flush([]);
        app.open('Test', 'Arnica');
        app.hotbitReady.set(true);
        app.available.set(12);
        fixture.detectChanges();
        const button = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((element) =>
            element.textContent?.includes('Analyze List'),
        )!;
        expect(button.disabled).toBe(true);
        app.targetGv.set(500);
        app.available.set(13);
        fixture.detectChanges();
        expect(button.disabled).toBe(false);
        const progress = (fixture.nativeElement as HTMLElement).querySelector('progress')!;
        expect(progress.value).toBe(13);
        expect(progress.max).toBe(13);
        expect((fixture.nativeElement as HTMLElement).querySelector('footer')?.textContent).toContain('Version 1.0.0');
        expect((fixture.nativeElement as HTMLElement).querySelector('footer')?.textContent).toContain('First version');
    });

    it('refreshes renamed default filenames on a 404 without blaming connectivity', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        TestBed.inject(HttpTestingController)
            .expectOne('/version.json')
            .flush({ version: '1.0.0', description: 'First version' });
        const http = TestBed.inject(HttpTestingController);
        const manifest = http.expectOne('/RATES/index.json');
        expect(manifest.request.headers.get('ngsw-bypass')).toBe('true');
        manifest.flush(['old.txt']);
        app.selectedDefault = 'old.txt';
        app.loadDefault();
        http.expectOne('/RATES/old.txt').flush('Missing', { status: 404, statusText: 'Not Found' });
        expect(app.error()).toContain('renamed or is missing');
        http.expectOne('/RATES/index.json').flush(['new.txt']);
        expect(app.defaults()).toEqual(['new.txt']);
        expect(app.selectedDefault).toBe('');
        app.selectedDefault = 'new.txt';
        app.loadDefault();
        http.expectOne('/RATES/new.txt').flush('Arnica');
        expect(app.rates()[0].name).toBe('Arnica');
        expect(app.error()).toBe('');
        http.verify();
    });

    it('uses the cached manifest when the network is unavailable', () => {
        const app = TestBed.createComponent(App).componentInstance;
        TestBed.inject(HttpTestingController)
            .expectOne('/version.json')
            .flush({ version: '1.0.0', description: 'First version' });
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/RATES/index.json').error(new ProgressEvent('error'));
        const fallback = http.expectOne('/RATES/index.json');
        expect(fallback.request.headers.has('ngsw-bypass')).toBe(false);
        fallback.flush(['cached.txt']);
        expect(app.defaults()).toEqual(['cached.txt']);
        http.verify();
    });

    it.each([false, true])('keeps camera collection active during analysis (failure: %s)', (failure) => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        TestBed.inject(HttpTestingController)
            .expectOne('/version.json')
            .flush({ version: '1.0.0', description: 'First version' });
        TestBed.inject(HttpTestingController).expectOne('/RATES/index.json').flush([]);
        app.open('Test', 'Arnica');
        app.camera.collecting.set(true);
        const stop = vi.spyOn(app.camera, 'stop');
        const analyze = vi
            .spyOn(TestBed.inject(HotbitStore), 'analyze')
            .mockImplementation(() =>
                failure
                    ? Promise.reject(new Error('Insufficient hotbits'))
                    : Promise.resolve([{ name: 'Arnica', originalIndex: 0, energeticScore: 50, gv: 1039 }]),
            );
        app.targetGv.set(500);
        app.runAnalysis();
        expect(stop).not.toHaveBeenCalled();
        return fixture.whenStable().then(() => {
            expect(analyze).toHaveBeenCalled();
            expect(stop).not.toHaveBeenCalled();
            expect(app.camera.collecting()).toBe(true);
            stop.mockRestore();
            analyze.mockRestore();
        });
    });

    it('preserves list, hotbits and results across modes and remembers the preference', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/version.json').flush({ version: '1.1.0', description: 'Redesign' });
        http.expectOne('/RATES/index.json').flush([]);
        app.open('Selected', 'Arnica');
        app.available.set(300);
        app.results.set([{ name: 'Arnica', originalIndex: 0, energeticScore: 50, gv: 1180 }]);
        app.setMode('advanced');
        expect(localStorage.getItem('radionics.ui-mode')).toBe('advanced');
        app.setMode('simple');
        expect(app.name).toBe('Selected');
        expect(app.available()).toBe(300);
        expect(app.results()[0].gv).toBe(1180);
        expect(app.resultWidth(590)).toBe(50);
        expect(app.currentStep()).toBe(4);
        app.results.set(
            Array.from({ length: 4 }, (_, originalIndex) => ({
                name: `Rate ${originalIndex}`,
                originalIndex,
                energeticScore: 50,
                gv: 1000 - originalIndex * 100,
            })),
        );
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelectorAll('.results-list li').length).toBe(3);
        app.expandedResults.set(true);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelectorAll('.results-list li').length).toBe(4);
        http.verify();
    });

    it('uses local lists from the simple selection control', () => {
        const app = TestBed.createComponent(App).componentInstance;
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/version.json').flush({ version: '1.1.0', description: 'Redesign' });
        http.expectOne('/RATES/index.json').flush([]);
        app.saved.set([{ id: 'local-id', name: 'Local', content: 'A\nB', createdAt: '2026-10-09' }]);
        app.listChoice = 'local:local-id';
        app.useChosenList();
        expect(app.rates().length).toBe(2);
        expect(app.name).toBe('Local');
        expect(app.readOnly).toBe(false);
        expect(app.currentStep()).toBe(2);
        http.verify();
    });

    it('only allows user-requested reloads while idle', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/version.json').flush({ version: '1.2.0', description: 'Updates' });
        http.expectOne('/RATES/index.json').flush([]);
        const reload = vi.spyOn(app.updates, 'reload').mockImplementation(() => {});
        app.updates.ready.set(true);
        app.camera.collecting.set(true);
        fixture.detectChanges();
        const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
            '.update-notice button',
        )!;
        expect(button.disabled).toBe(true);
        app.updateNow();
        expect(reload).not.toHaveBeenCalled();
        app.camera.collecting.set(false);
        app.analyzing.set(true);
        app.updateNow();
        expect(reload).not.toHaveBeenCalled();
        app.analyzing.set(false);
        fixture.detectChanges();
        expect(button.disabled).toBe(false);
        app.updateNow();
        return vi.waitFor(() => expect(reload).toHaveBeenCalledOnce()).then(() => reload.mockRestore());
    });

    it('waits for the final collection write before reloading', () => {
        const app = TestBed.createComponent(App).componentInstance;
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/version.json').flush({ version: '1.2.0', description: 'Updates' });
        http.expectOne('/RATES/index.json').flush([]);
        const store = TestBed.inject(HotbitStore);
        let finishWrite!: () => void;
        const append = vi
            .spyOn(store, 'append')
            .mockImplementation(() => new Promise<void>((resolve) => (finishWrite = resolve)));
        const start = vi.spyOn(app.camera, 'start').mockImplementation((sink) => {
            sink(new Uint32Array([123]));
            return Promise.resolve();
        });
        const reload = vi.spyOn(app.updates, 'reload').mockImplementation(() => {});
        app.startCollection();
        app.updates.ready.set(true);
        app.updateNow();
        expect(app.updateApplying()).toBe(true);
        return vi
            .waitFor(() => expect(append).toHaveBeenCalledOnce())
            .then(() => {
                expect(reload).not.toHaveBeenCalled();
                app.startCollection();
                expect(start).toHaveBeenCalledOnce();
                finishWrite();
                return vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());
            })
            .finally(() => {
                append.mockRestore();
                start.mockRestore();
                reload.mockRestore();
            });
    });

    it('loads the manifest and keeps predefined lists read-only', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        TestBed.inject(HttpTestingController)
            .expectOne('/version.json')
            .flush({ version: '1.0.0', description: 'First version' });
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/RATES/index.json').flush(['example.txt']);
        app.selectedDefault = 'example.txt';
        app.loadDefault();
        http.expectOne('/RATES/example.txt').flush('Arnica\nChina');
        expect(app.readOnly).toBe(true);
        expect(app.rates().length).toBe(2);
        app.makeCopy();
        expect(app.readOnly).toBe(false);
        http.verify();
    });
});

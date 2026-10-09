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
            element.textContent?.includes('Analyze loaded list'),
        )!;
        expect(button.disabled).toBe(true);
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

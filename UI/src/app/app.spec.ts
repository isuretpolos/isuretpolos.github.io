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
    });

    it('loads the manifest and keeps predefined lists read-only', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
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

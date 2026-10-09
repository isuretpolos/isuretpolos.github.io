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

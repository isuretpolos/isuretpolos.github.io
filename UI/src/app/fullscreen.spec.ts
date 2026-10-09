import { TestBed } from '@angular/core/testing';
import { Fullscreen } from './fullscreen';

describe('Reusable fullscreen', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
    });
    it('synchronizes native entry and exit from fullscreenchange', () => {
        const service = TestBed.inject(Fullscreen);
        const target = document.createElement('div');
        const enter = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(target, 'requestFullscreen', { value: enter });
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null });
        const current = vi.spyOn(document, 'fullscreenElement', 'get').mockReturnValue(target);
        document.dispatchEvent(new Event('fullscreenchange'));
        expect(service.target()).toBe(target);
        current.mockReturnValue(null);
        document.dispatchEvent(new Event('fullscreenchange'));
        service.toggle(target);
        expect(enter).toHaveBeenCalledOnce();
        document.dispatchEvent(new Event('fullscreenchange'));
        expect(service.target()).toBeNull();
    });
    it('provides expanded fallback and a clear exit when unsupported', () => {
        const service = TestBed.inject(Fullscreen);
        const target = document.createElement('div');
        service.toggle(target);
        expect(target.classList.contains('fullscreen-fallback')).toBe(true);
        service.exit();
        expect(target.classList.contains('fullscreen-fallback')).toBe(false);
        expect(service.target()).toBeNull();
    });
});

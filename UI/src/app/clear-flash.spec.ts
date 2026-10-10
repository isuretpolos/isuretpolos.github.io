import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ClearFlash } from './clear-flash';

it('flashes purple for exactly four seconds and ignores repeated triggers', () => {
    vi.useFakeTimers();
    try {
        const flash = TestBed.inject(ClearFlash);
        flash.start();
        expect(document.documentElement.classList.contains('purple-clearing')).toBe(true);
        vi.advanceTimersByTime(2000);
        flash.start();
        vi.advanceTimersByTime(1999);
        expect(flash.active()).toBe(true);
        vi.advanceTimersByTime(1);
        expect(flash.active()).toBe(false);
        expect(document.documentElement.classList.contains('purple-clearing')).toBe(false);
    } finally {
        TestBed.resetTestingModule();
        vi.useRealTimers();
    }
});

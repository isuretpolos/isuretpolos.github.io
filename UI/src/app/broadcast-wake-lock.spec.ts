import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BroadcastWakeLock } from './broadcast-wake-lock';

function sentinel() {
    return Object.assign(new EventTarget(), { release: vi.fn().mockResolvedValue(undefined) });
}

describe('Broadcast screen wake lock', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'wakeLock', { configurable: true, get: () => undefined });
        TestBed.configureTestingModule({ providers: [BroadcastWakeLock] });
    });
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
        Reflect.deleteProperty(navigator, 'wakeLock');
    });

    it('reacquires the lock when returning to the visible fullscreen broadcast', () => {
        const first = sentinel();
        const second = sentinel();
        const request = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
        vi.spyOn(navigator, 'wakeLock', 'get').mockReturnValue({ request } as unknown as WakeLock);
        const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
        const service = TestBed.inject(BroadcastWakeLock);
        service.setEnabled(true);
        return Promise.resolve()
            .then(() => {
                hidden.mockReturnValue(true);
                document.dispatchEvent(new Event('visibilitychange'));
                expect(first.release).toHaveBeenCalledTimes(1);
                hidden.mockReturnValue(false);
                document.dispatchEvent(new Event('visibilitychange'));
                return Promise.resolve();
            })
            .then(() => {
                expect(request).toHaveBeenCalledTimes(2);
                expect(service.active()).toBe(true);
                service.setEnabled(false);
                expect(second.release).toHaveBeenCalledTimes(1);
            });
    });

    it('reports a denied request without interrupting broadcasting', () => {
        vi.spyOn(navigator, 'wakeLock', 'get').mockReturnValue({
            request: () => Promise.reject(new Error('Denied')),
        } as unknown as WakeLock);
        const service = TestBed.inject(BroadcastWakeLock);
        service.setEnabled(true);
        return Promise.resolve()
            .then(() => {})
            .then(() => {
                expect(service.active()).toBe(false);
                expect(service.message()).toContain('declined');
            });
    });
    it('requests the screen lock and releases it when disabled', () => {
        const lock = sentinel();
        const request = vi.fn().mockResolvedValue(lock);
        vi.spyOn(navigator, 'wakeLock', 'get').mockReturnValue({ request } as unknown as WakeLock);
        const service = TestBed.inject(BroadcastWakeLock);
        service.setEnabled(true);
        return Promise.resolve().then(() => {
            expect(request).toHaveBeenCalledWith('screen');
            expect(service.active()).toBe(true);
            service.setEnabled(false);
            expect(lock.release).toHaveBeenCalledTimes(1);
            expect(service.active()).toBe(false);
        });
    });

    it('releases a late lock arriving after broadcasting stops', () => {
        const lock = sentinel();
        let resolve!: (lock: unknown) => void;
        const request = () => new Promise((done) => (resolve = done));
        vi.spyOn(navigator, 'wakeLock', 'get').mockReturnValue({ request } as unknown as WakeLock);
        const service = TestBed.inject(BroadcastWakeLock);
        service.setEnabled(true);
        service.setEnabled(false);
        resolve(lock);
        return Promise.resolve().then(() => {
            expect(lock.release).toHaveBeenCalledTimes(1);
            expect(service.active()).toBe(false);
        });
    });
});

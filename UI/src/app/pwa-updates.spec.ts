import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PwaUpdates, RELOAD_APPLICATION } from './pwa-updates';

describe('PWA update detection', () => {
    let events: Subject<VersionEvent>;
    let check: ReturnType<typeof vi.fn>;
    let reload: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        events = new Subject<VersionEvent>();
        check = vi.fn().mockResolvedValue(false);
        reload = vi.fn();
        TestBed.configureTestingModule({
            providers: [
                { provide: SwUpdate, useValue: { isEnabled: true, versionUpdates: events, checkForUpdate: check } },
                { provide: RELOAD_APPLICATION, useValue: reload },
            ],
        });
    });
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
    });

    it('checks at startup and on foreground, without checks in the background', () => {
        TestBed.inject(PwaUpdates);
        expect(check).toHaveBeenCalledOnce();
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(check).toHaveBeenCalledOnce();
        return vi.waitFor(() => {
            visibility.mockReturnValue('visible');
            document.dispatchEvent(new Event('visibilitychange'));
            expect(check.mock.calls.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('notifies only for ready versions and never forces a reload', () => {
        const updates = TestBed.inject(PwaUpdates);
        events.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });
        expect(updates.ready()).toBe(false);
        events.next({ type: 'VERSION_READY', currentVersion: { hash: 'old' }, latestVersion: { hash: 'new' } });
        expect(updates.ready()).toBe(true);
        expect(reload).not.toHaveBeenCalled();
        localStorage.setItem('update-preservation-test', 'saved');
        updates.reload();
        expect(reload).toHaveBeenCalledOnce();
        expect(localStorage.getItem('update-preservation-test')).toBe('saved');
        localStorage.removeItem('update-preservation-test');
    });

    it('deduplicates pending checks and handles offline failure without reload', () => {
        let rejectCheck!: (reason: Error) => void;
        check.mockImplementation(() => new Promise<boolean>((resolve, reject) => (rejectCheck = reject)));
        const updates = TestBed.inject(PwaUpdates);
        updates.check();
        updates.check();
        expect(check).toHaveBeenCalledOnce();
        rejectCheck(new Error('Offline'));
        return vi
            .waitFor(() => expect(updates.checkError()).toContain('unavailable'))
            .then(() => {
                check.mockResolvedValue(false);
                updates.check();
                expect(check).toHaveBeenCalledTimes(2);
                expect(reload).not.toHaveBeenCalled();
            });
    });

    it('does nothing when service workers are disabled', () => {
        TestBed.overrideProvider(SwUpdate, { useValue: { isEnabled: false } });
        const updates = TestBed.inject(PwaUpdates);
        updates.check();
        expect(check).not.toHaveBeenCalled();
        expect(updates.ready()).toBe(false);
    });

    it('removes listeners and subscriptions when destroyed', () => {
        const updates = TestBed.inject(PwaUpdates);
        TestBed.resetTestingModule();
        events.next({ type: 'VERSION_READY', currentVersion: { hash: 'old' }, latestVersion: { hash: 'new' } });
        document.dispatchEvent(new Event('visibilitychange'));
        expect(updates.ready()).toBe(false);
        expect(check).toHaveBeenCalledOnce();
    });
});

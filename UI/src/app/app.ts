import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { parseRates, Rate, SavedList } from './rate-list';
import { RateListStore } from './rate-list-store';
import { HotbitStore } from './hotbit-store';
import { CameraHotbits } from './camera-hotbits';
import { AnalysisResult } from './analysis';

@Component({
    selector: 'app-root',
    imports: [FormsModule],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App {
    private readonly http = inject(HttpClient);
    private readonly store = inject(RateListStore);
    readonly defaults = signal<string[]>([]);
    readonly saved = signal<SavedList[]>([]);
    readonly rates = signal<Rate[]>([]);
    readonly message = signal('');
    readonly error = signal('');
    readonly loading = signal(false);
    readonly storageReady = signal(false);
    readonly camera = inject(CameraHotbits);
    private readonly hotbits = inject(HotbitStore);
    readonly available = signal(0);
    readonly consumed = signal(0);
    readonly analyzing = signal(false);
    readonly results = signal<AnalysisResult[]>([]);
    readonly resultListName = signal('');
    readonly hotbitReady = signal(false);
    private writes: Promise<void> = Promise.resolve();
    readonly required = (): number => this.rates().length * 10 + Math.min(20, this.rates().length) * 3;
    name = '';
    content = '';
    selectedDefault = '';
    editingId: string | undefined;
    readOnly = false;

    constructor() {
        const stop = () => this.camera.stop();
        const hidden = () => {
            if (document.hidden) {
                stop();
            }
        };
        window.addEventListener('pagehide', stop);
        document.addEventListener('visibilitychange', hidden);
        inject(DestroyRef).onDestroy(() => {
            stop();
            window.removeEventListener('pagehide', stop);
            document.removeEventListener('visibilitychange', hidden);
        });
        this.refreshHotbits();
        try {
            this.saved.set(this.store.load());
            this.storageReady.set(true);
        } catch (error) {
            this.fail(error);
        }
        this.http.get<string[]>('/RATES/index.json', { headers: { 'ngsw-bypass': 'true' } }).subscribe({
            next: (files) => this.defaults.set(files),
            error: () => {
                // Previously downloaded manifests remain usable when the network is unavailable.
                this.http.get<string[]>('/RATES/index.json').subscribe({
                    next: (files) => this.defaults.set(files),
                    error: () =>
                        this.fail(new Error('Default lists are unavailable. You can still paste or import a list.')),
                });
            },
        });
    }

    loadDefault(): void {
        if (!this.selectedDefault || this.loading()) {
            return;
        }
        this.loading.set(true);
        const filename = this.selectedDefault;
        this.error.set('');
        this.http.get(`/RATES/${encodeURIComponent(filename)}`, { responseType: 'text' }).subscribe({
            next: (content) => {
                this.open(filename.replace(/\.txt$/i, ''), content, undefined, true);
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                if (error.status === 404) {
                    this.http.get<string[]>('/RATES/index.json', { headers: { 'ngsw-bypass': 'true' } }).subscribe({
                        next: (files) => {
                            this.defaults.set(files);
                            if (!files.includes(this.selectedDefault)) {
                                this.selectedDefault = '';
                            }
                        },
                        error: () => {},
                    });
                }
                this.loading.set(false);
                this.fail(
                    new Error(
                        error.status === 404
                            ? `The default list "${filename}" was renamed or is missing. Refreshing the available lists; please select again.`
                            : error.status === 0
                              ? 'Could not reach this default list. Connect to the internet to download it for the first time.'
                              : `Could not load "${filename}" (HTTP ${error.status}). Please try again.`,
                    ),
                );
            },
        });
    }

    open(name: string, content: string, id?: string, readOnly = false): void {
        if (!parseRates(content).length) {
            this.fail(new Error('The list contains no rates.'));
            return;
        }
        this.name = name;
        this.content = content;
        this.editingId = id;
        this.readOnly = readOnly;
        this.preview();
    }

    newList(): void {
        this.results.set([]);
        this.name = '';
        this.content = '';
        this.editingId = undefined;
        this.readOnly = false;
        this.rates.set([]);
        this.message.set('Paste rates below, one per line.');
        this.error.set('');
    }

    makeCopy(): void {
        this.editingId = undefined;
        this.readOnly = false;
        this.name += ' (copy)';
        this.message.set('Editable copy ready. Save to keep it on this device.');
    }

    preview(): void {
        this.results.set([]);
        this.rates.set(parseRates(this.content));
        this.message.set(`${this.rates().length} rates loaded. Duplicate names retain their original order.`);
        this.error.set('');
    }

    save(): void {
        try {
            const updated = this.store.save(this.saved(), this.name, this.content, this.editingId);
            this.saved.set(updated);
            this.editingId = this.editingId ?? updated[updated.length - 1].id;
            this.preview();
            this.message.set('List saved on this device.');
        } catch (error) {
            this.fail(error);
        }
    }

    remove(list: SavedList): void {
        if (!confirm(`Delete local list "${list.name}"? Export a backup first if needed.`)) {
            return;
        }
        try {
            this.saved.set(this.store.remove(this.saved(), list.id));
            if (this.editingId === list.id) {
                this.newList();
            }
            this.message.set('Local list deleted.');
        } catch (error) {
            this.fail(error);
        }
    }

    importFile(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }
        file.arrayBuffer()
            .then((buffer) => {
                const content = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                this.open(file.name.replace(/\.txt$/i, ''), content);
            })
            .catch(() => this.fail(new Error('Unable to read the file as UTF-8 text.')))
            .finally(() => (input.value = ''));
    }

    exportList(): void {
        const url = URL.createObjectURL(new Blob([this.content], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.name.replace(/[^a-zA-Z0-9 _-]/g, '_') || 'rates'}.txt`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    startCollection(): void {
        this.error.set('');
        this.camera
            .start((words) => {
                this.writes = this.writes
                    .then(() => this.hotbits.append(words))
                    .then(() => this.refreshHotbits())
                    .catch((error) => {
                        this.camera.stop();
                        this.fail(error);
                    });
            })
            .catch((error) => this.fail(error));
    }

    runAnalysis(): void {
        if (this.analyzing() || !this.rates().length) {
            return;
        }
        const rates = this.rates().map((rate) => ({ ...rate }));
        const listName = this.name || 'Untitled list';
        this.analyzing.set(true);
        this.results.set([]);
        this.error.set('');
        this.writes
            .then(() => this.hotbits.analyze(rates))
            .then((results) => {
                this.results.set(results);
                this.resultListName.set(listName);
                this.message.set('Analysis complete. All random draws consumed fresh stored hotbits.');
            })
            .catch((error) => this.fail(error))
            .finally(() => {
                this.analyzing.set(false);
                this.refreshHotbits();
            });
    }

    requestPersistence(): void {
        if (!navigator.storage?.persist) {
            this.fail(new Error('Persistent storage requests are unsupported in this browser.'));
            return;
        }
        navigator.storage
            .persist()
            .then((granted) =>
                this.message.set(
                    granted
                        ? 'Persistent browser storage granted. Clearing site data still erases local data.'
                        : 'Persistent storage was not granted. Browser data may be evicted.',
                ),
            )
            .catch((error) => this.fail(error));
    }

    private refreshHotbits(): Promise<void> {
        return this.hotbits
            .counts()
            .then((counts) => {
                this.available.set(counts.available);
                this.consumed.set(counts.consumed);
                this.hotbitReady.set(true);
            })
            .catch((error) => {
                this.hotbitReady.set(false);
                this.fail(error);
            });
    }

    private fail(error: unknown): void {
        this.error.set(
            error instanceof Error
                ? error.message
                : 'Browser storage is unavailable or full. Export your list to keep a backup.',
        );
        this.message.set('');
    }
}

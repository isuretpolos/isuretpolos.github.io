import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { parseRates, Rate, SavedList } from './rate-list';
import { RateListStore } from './rate-list-store';

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
    name = '';
    content = '';
    selectedDefault = '';
    editingId: string | undefined;
    readOnly = false;

    constructor() {
        try {
            this.saved.set(this.store.load());
            this.storageReady.set(true);
        } catch (error) {
            this.fail(error);
        }
        this.http.get<string[]>('/RATES/index.json').subscribe({
            next: (files) => this.defaults.set(files),
            error: () => this.fail(new Error('Default lists are unavailable. You can still paste or import a list.')),
        });
    }

    loadDefault(): void {
        if (!this.selectedDefault || this.loading()) {
            return;
        }
        this.loading.set(true);
        this.http.get(`/RATES/${encodeURIComponent(this.selectedDefault)}`, { responseType: 'text' }).subscribe({
            next: (content) => {
                this.open(this.selectedDefault.replace(/\.txt$/i, ''), content, undefined, true);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.fail(
                    new Error('Could not load this default list. Its first download needs an internet connection.'),
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

    private fail(error: unknown): void {
        this.error.set(
            error instanceof Error
                ? error.message
                : 'Browser storage is unavailable or full. Export your list to keep a backup.',
        );
        this.message.set('');
    }
}

import { Injectable } from '@angular/core';
import { parseRates, SavedList } from './rate-list';

@Injectable({ providedIn: 'root' })
export class RateListStore {
    private readonly key = 'radionics.rate-lists.v1';

    load(): SavedList[] {
        const stored = localStorage.getItem(this.key);
        if (!stored) {
            return [];
        }
        const lists: unknown = JSON.parse(stored);
        if (
            !Array.isArray(lists) ||
            !lists.every(
                (list) =>
                    list &&
                    typeof list.id === 'string' &&
                    typeof list.name === 'string' &&
                    typeof list.content === 'string' &&
                    typeof list.createdAt === 'string',
            )
        ) {
            throw new Error('Saved lists are unreadable. Browser data has not been overwritten.');
        }
        return lists;
    }

    save(lists: SavedList[], name: string, content: string, id?: string): SavedList[] {
        if (!name.trim() || !parseRates(content).length) {
            throw new Error('Enter a list name and at least one rate.');
        }
        const previous = lists.find((list) => list.id === id);
        const entry: SavedList = {
            id: previous?.id ?? crypto.randomUUID(),
            name: name.trim(),
            content,
            createdAt: previous?.createdAt ?? new Date().toISOString(),
        };
        const updated = previous ? lists.map((list) => (list.id === entry.id ? entry : list)) : [...lists, entry];
        localStorage.setItem(this.key, JSON.stringify(updated));
        return updated;
    }

    remove(lists: SavedList[], id: string): SavedList[] {
        const updated = lists.filter((list) => list.id !== id);
        localStorage.setItem(this.key, JSON.stringify(updated));
        return updated;
    }
}

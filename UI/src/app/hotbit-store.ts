import { Injectable } from '@angular/core';
import { AnalysisResult, analyzeRates, calculateGv, HotbitDraws } from './analysis';
import { resonanceHits } from './broadcast';
import { Rate } from './rate-list';
import { analyzePhotoGrid, PhotoCell } from './photo-grid';
import { calculateLiveGv } from './gv-expansion';

interface Batch {
    id?: number;
    words: Uint32Array;
    cursor: number;
}

@Injectable({ providedIn: 'root' })
export class HotbitStore {
    private database?: Promise<IDBDatabase>;

    private open(): Promise<IDBDatabase> {
        if (!this.database) {
            this.database = new Promise((resolve, reject) => {
                const request = indexedDB.open('radionics.hotbits.v1', 1);
                request.onupgradeneeded = () => {
                    request.result.createObjectStore('batches', { keyPath: 'id', autoIncrement: true });
                    request.result.createObjectStore('metadata');
                };
                request.onsuccess = () => {
                    request.result.onversionchange = () => request.result.close();
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
                request.onblocked = () => reject(new Error('Close other application tabs to open hotbit storage.'));
            });
        }
        return this.database;
    }

    append(words: Uint32Array): Promise<void> {
        return this.open().then(
            (database) =>
                new Promise<void>((resolve, reject) => {
                    const transaction = database.transaction('batches', 'readwrite');
                    transaction.objectStore('batches').add({ words, cursor: 0 });
                    transaction.oncomplete = () => resolve();
                    transaction.onabort = () =>
                        reject(transaction.error ?? new Error('Hotbit storage failed or is full.'));
                }),
        );
    }

    counts(): Promise<{ available: number; consumed: number }> {
        return this.open().then(
            (database) =>
                new Promise((resolve, reject) => {
                    const transaction = database.transaction(['batches', 'metadata']);
                    const batches = transaction.objectStore('batches').getAll();
                    const consumed = transaction.objectStore('metadata').get('consumed');
                    transaction.oncomplete = () =>
                        resolve({
                            available: (batches.result as Batch[]).reduce(
                                (count, batch) => count + batch.words.length - batch.cursor,
                                0,
                            ),
                            consumed: consumed.result ?? 0,
                        });
                    transaction.onabort = () => reject(transaction.error);
                }),
        );
    }

    analyze(rates: Rate[]): Promise<AnalysisResult[]> {
        return this.consume((draws) => analyzeRates(rates, draws));
    }

    analyzePhoto(width: number, height: number, grid: number): Promise<PhotoCell[]> {
        return this.consume((draws) => analyzePhotoGrid(width, height, grid, draws));
    }

    liveMeasurement(): Promise<ReturnType<typeof calculateLiveGv>> {
        return this.consume((draws) => calculateLiveGv(draws));
    }

    targetMeasurement(): Promise<number> {
        return this.consume((draws) => calculateGv(draws));
    }

    broadcastResonance(count: number, multiplier: number): Promise<boolean[]> {
        return this.consume((draws) => resonanceHits(count, multiplier, draws));
    }

    private consume<T>(analysis: (draws: HotbitDraws) => T): Promise<T> {
        return this.open().then(
            (database) =>
                new Promise((resolve, reject) => {
                    // Selection and consumption share a write transaction, including across browser tabs.
                    const transaction = database.transaction(['batches', 'metadata'], 'readwrite');
                    const store = transaction.objectStore('batches');
                    const request = store.getAll();
                    const metadata = transaction.objectStore('metadata');
                    const total = metadata.get('consumed');
                    let result: T;
                    let failure: unknown;
                    request.onsuccess = () => {
                        const batches = request.result as Batch[];
                        const length = batches.reduce((sum, batch) => sum + batch.words.length - batch.cursor, 0);
                        const words = new Uint32Array(length);
                        let offset = 0;
                        for (const batch of batches) {
                            const remaining = batch.words.subarray(batch.cursor);
                            words.set(remaining, offset);
                            offset += remaining.length;
                        }
                        const draws = new HotbitDraws(words);
                        try {
                            result = analysis(draws);
                        } catch (error) {
                            failure = error;
                        }
                        // Even failed attempts retire observed material; retry never reuses these draws.
                        let remaining = draws.consumed;
                        for (const batch of batches) {
                            const used = Math.min(remaining, batch.words.length - batch.cursor);
                            batch.cursor += used;
                            remaining -= used;
                            if (batch.cursor === batch.words.length) {
                                store.delete(batch.id!);
                            } else if (used) {
                                store.put(batch);
                            }
                        }
                        total.onsuccess = () => metadata.put((total.result ?? 0) + draws.consumed, 'consumed');
                    };
                    transaction.oncomplete = () => (failure ? reject(failure) : resolve(result));
                    transaction.onabort = () =>
                        reject(transaction.error ?? new Error('Analysis storage transaction failed.'));
                }),
        );
    }
}

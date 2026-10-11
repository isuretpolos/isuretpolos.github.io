import { Injectable, signal } from '@angular/core';

export interface PairingPayload {
    type: 'aetherone-hotbits';
    protocolVersion: 1;
    endpoint: string;
    pairingCode: string;
}
export interface RemoteStatus {
    protocolVersion: number;
    source: string;
    generator: string;
    availableBytes: number;
    generating: boolean;
    maxBatchBytes: number;
}
interface Credentials {
    endpoint: string;
    accessToken: string;
    expiresAt: string;
}
export function parsePairing(text: string): PairingPayload {
    const payload = JSON.parse(text) as PairingPayload;
    const url = new URL(payload.endpoint);
    if (
        payload.type !== 'aetherone-hotbits' ||
        payload.protocolVersion !== 1 ||
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/api/hotbits/v1' ||
        typeof payload.pairingCode !== 'string' ||
        !payload.pairingCode.trim() ||
        'accessToken' in payload
    ) {
        throw new Error('Invalid QR: HTTPS API v1 endpoint and pairing code required.');
    }
    return { ...payload, endpoint: url.href };
}
export function allocationUrl(endpoint: string, path: string, id: string): string {
    if (!/^[a-zA-Z0-9-]{1,128}$/.test(id) || path !== `/api/hotbits/v1/allocations/${id}/data`) {
        throw new Error('Invalid allocation download path.');
    }
    return new URL(path, endpoint).href;
}

@Injectable({ providedIn: 'root' })
export class HotbitsConnectionService {
    readonly connected = signal(false);
    readonly host = signal('');
    readonly status = signal<RemoteStatus | null>(null);
    readonly latestSync = signal('');
    private credentials?: Credentials;
    private controller = new AbortController();

    constructor() {
        try {
            const saved = localStorage.getItem('radionics.remote-hotbits');
            if (saved) {
                const credentials = JSON.parse(saved) as Credentials;
                parsePairing(
                    JSON.stringify({
                        type: 'aetherone-hotbits',
                        protocolVersion: 1,
                        endpoint: credentials.endpoint,
                        pairingCode: 'validation',
                    }),
                );
                if (typeof credentials.accessToken === 'string' && Date.parse(credentials.expiresAt) > Date.now()) {
                    this.credentials = credentials;
                    this.host.set(new URL(credentials.endpoint).host);
                    this.connected.set(true);
                }
            }
        } catch {
            /* Invalid saved credentials require pairing again. */
        }
    }

    endpoint(): string {
        return this.credentials?.endpoint ?? '';
    }

    pair(payload: PairingPayload): Promise<void> {
        return this.request<{ accessToken: string; expiresAt: string; protocolVersion: number }>(
            payload.endpoint + '/pair',
            { pairingCode: payload.pairingCode, clientName: 'Radionics Workspace' },
            false,
        ).then((result) => {
            if (result.protocolVersion !== 1 || !result.accessToken || !(Date.parse(result.expiresAt) > Date.now())) {
                throw new Error('Invalid or expired pairing response.');
            }
            const credentials = {
                endpoint: payload.endpoint,
                accessToken: result.accessToken,
                expiresAt: result.expiresAt,
            };
            localStorage.setItem('radionics.remote-hotbits', JSON.stringify(credentials));
            this.credentials = credentials;
            this.host.set(new URL(payload.endpoint).host);
            this.connected.set(true);
        });
    }

    refresh(): Promise<RemoteStatus> {
        return this.api<RemoteStatus>('/status').then((status) => {
            if (
                status.protocolVersion !== 1 ||
                !Number.isSafeInteger(status.availableBytes) ||
                status.availableBytes < 0 ||
                !Number.isSafeInteger(status.maxBatchBytes) ||
                status.maxBatchBytes < 1
            ) {
                throw new Error('Invalid server inventory response.');
            }
            this.status.set(status);
            this.latestSync.set(new Date().toLocaleString());
            return status;
        });
    }

    api<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>(this.endpoint() + path, body);
    }

    download(path: string, id: string): Promise<ArrayBuffer> {
        return this.fetch(allocationUrl(this.endpoint(), path, id)).then((response) => {
            if (!response.headers.get('content-type')?.startsWith('application/octet-stream')) {
                throw new Error('Expected raw hotbit bytes.');
            }
            return response.arrayBuffer();
        });
    }

    cancel(): void {
        this.controller.abort();
        this.controller = new AbortController();
    }

    disconnect(): void {
        this.cancel();
        localStorage.removeItem('radionics.remote-hotbits');
        this.credentials = undefined;
        this.connected.set(false);
        this.status.set(null);
        this.host.set('');
    }

    private request<T>(url: string, body?: unknown, authenticated = true): Promise<T> {
        return this.fetch(url, body, authenticated).then((response) =>
            response.text().then((text) => (text ? (JSON.parse(text) as T) : (undefined as T))),
        );
    }

    private fetch(url: string, body?: unknown, authenticated = true): Promise<Response> {
        if (authenticated && (!this.credentials || !(Date.parse(this.credentials.expiresAt) > Date.now()))) {
            return Promise.reject(new Error('Token expired. Pair again.'));
        }
        const headers: Record<string, string> = {};
        if (authenticated) {
            headers['Authorization'] = `Bearer ${this.credentials!.accessToken}`;
        }
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }
        const controller = this.controller;
        const timeout = setTimeout(() => controller.abort(), 15000);
        return fetch(url, {
            method: body === undefined ? 'GET' : 'POST',
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: this.controller.signal,
            credentials: 'omit',
            cache: 'no-store',
            redirect: 'error',
            referrerPolicy: 'no-referrer',
        })
            .then((response) => {
                if (response.ok) {
                    return response;
                }
                return response
                    .json()
                    .catch(() => null)
                    .then((error) => {
                        throw new Error(
                            response.status === 401
                                ? 'Token expired. Pair again.'
                                : (error?.error?.message ??
                                      `Server disabled or request rejected (HTTP ${response.status}).`),
                        );
                    });
            })
            .catch((error) => {
                if (error instanceof TypeError) {
                    throw new Error(
                        'LAN endpoint unreachable. Check the same network, trusted certificate, CORS and browser local-network permission. Browsers do not reveal which of these blocked the request.',
                    );
                }
                throw error;
            })
            .finally(() => clearTimeout(timeout));
    }
}

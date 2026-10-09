export interface Rate {
    name: string;
    originalIndex: number;
    url?: string;
}

export interface SavedList {
    id: string;
    name: string;
    content: string;
    createdAt: string;
}

export function parseRates(content: string): Rate[] {
    return content
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .flatMap((line, originalIndex) => {
            const [label, information] = line.split('\t');
            const name = label.trim();
            if (!name) {
                return [];
            }
            let url: string | undefined;
            try {
                const candidate = new URL(information?.trim() ?? '');
                if (candidate.protocol === 'https:' || candidate.protocol === 'http:') {
                    url = candidate.href;
                }
            } catch {
                // Additional information without a valid web URL remains undisplayed.
            }
            return [{ name, originalIndex, url }];
        });
}

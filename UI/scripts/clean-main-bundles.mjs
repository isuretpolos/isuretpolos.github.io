import { readdirSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
let removed = 0;

// Only remove generated Angular main and style bundles directly in the repository root.
for (const entry of readdirSync(root, { withFileTypes: true })) {
    const isMainBundle = /^main-[a-zA-Z0-9_-]+\.js$/.test(entry.name);
    const isStyleBundle = /^styles-[a-zA-Z0-9_-]+\.css$/.test(entry.name);
    if (entry.isFile() && (isMainBundle || isStyleBundle)) {
        unlinkSync(join(root, entry.name));
        removed++;
    }
}

console.log(`Removed ${removed} root main and style bundles. Other files and directories were preserved.`);

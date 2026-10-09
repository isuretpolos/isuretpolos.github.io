import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function bumpVersion(version, change) {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
        throw new Error('Version must use major.minor.patch format.');
    }
    const parts = version.split('.').map(Number);
    if (!parts.every(Number.isSafeInteger)) {
        throw new Error('Version numbers exceed the supported range.');
    }
    const index = { major: 0, minor: 1, patch: 2, bugfix: 2 }[change];
    if (index === undefined) {
        throw new Error('Choose major, minor, patch or bugfix.');
    }
    parts[index]++;
    if (!Number.isSafeInteger(parts[index])) {
        throw new Error('Version number exceeds the supported range.');
    }
    for (let next = index + 1; next < parts.length; next++) {
        parts[next] = 0;
    }
    return parts.join('.');
}

function main() {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
    const path = resolve(root, 'version.json');
    const [change, ...descriptionParts] = process.argv.slice(2);
    const current = existsSync(path)
        ? JSON.parse(readFileSync(path, 'utf8'))
        : {
              version: '1.0.0',
              description: 'First version',
          };
    if (!/^\d+\.\d+\.\d+$/.test(current.version) || typeof current.description !== 'string') {
        throw new Error('Invalid version.json. Existing contents have not been overwritten.');
    }
    if (change && change !== 'sync') {
        const description = descriptionParts.join(' ').trim();
        if (!description) {
            throw new Error('Supply a description for the version change.');
        }
        current.version = bumpVersion(current.version, change);
        current.description = description;
    }
    writeFileSync(path, JSON.stringify(current, null, 4) + '\n');
    copyFileSync(path, resolve(root, 'UI/public/version.json'));
    console.log(`Version ${current.version}: ${current.description}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main();
}

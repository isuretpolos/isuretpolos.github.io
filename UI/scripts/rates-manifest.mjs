import { copyFileSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const rates = resolve(directory, '../../RATES');
const publicRates = resolve(directory, '../public/RATES');
const files = readdirSync(rates)
    .filter((file) => file.endsWith('.txt'))
    .sort();
const manifest = JSON.stringify(files, null, 4) + '\n';
writeFileSync(resolve(rates, 'index.json'), manifest);
mkdirSync(publicRates, { recursive: true });
// Remove only obsolete text copies inside the generated public rate directory.
for (const file of readdirSync(publicRates)) {
    if (file.endsWith('.txt') && !files.includes(file)) {
        unlinkSync(resolve(publicRates, file));
    }
}
writeFileSync(resolve(publicRates, 'index.json'), manifest);
for (const file of files) {
    copyFileSync(resolve(rates, file), resolve(publicRates, file));
}

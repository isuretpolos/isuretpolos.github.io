import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
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
writeFileSync(resolve(publicRates, 'index.json'), manifest);
for (const file of files) {
    copyFileSync(resolve(rates, file), resolve(publicRates, file));
}

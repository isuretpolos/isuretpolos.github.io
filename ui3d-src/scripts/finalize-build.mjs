import {copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const license = fileURLToPath(new URL('../dist/3rdpartylicenses.txt', import.meta.url));
const output = fileURLToPath(new URL('../dist/browser/3rdpartylicenses.txt', import.meta.url));
// Angular emits aggregate notices next to browser/, so include them in the published directory.
copyFileSync(license, output);

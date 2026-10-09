import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = join(root, 'UI/dist/radionics/browser');
const allowedFiles =
    /^(index\.html|favicon\.ico|manifest\.webmanifest|ngsw\.json|ngsw-worker\.js|safety-worker\.js|worker-basic\.min\.js|.*\.(js|css|txt))$/;

if (!existsSync(join(output, 'index.html'))) {
    throw new Error('Build the Angular application before preparing root files.');
}

function copyDirectory(source, destination) {
    mkdirSync(destination, { recursive: true });
    for (const entry of readdirSync(source, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            copyDirectory(join(source, entry.name), join(destination, entry.name));
        } else {
            copyFileSync(join(source, entry.name), join(destination, entry.name));
        }
    }
}

for (const entry of readdirSync(output, { withFileTypes: true })) {
    if (entry.isFile() && allowedFiles.test(entry.name)) {
        copyFileSync(join(output, entry.name), join(root, entry.name));
    } else if (entry.isDirectory() && ['icons', 'assets'].includes(entry.name)) {
        copyDirectory(join(output, entry.name), join(root, entry.name));
    }
}
writeFileSync(join(root, '.nojekyll'), '');
console.log('Production files prepared in the repository root. No Git operations performed.');

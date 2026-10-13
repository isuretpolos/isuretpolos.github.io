import {cpSync, existsSync, mkdirSync, readdirSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const source = fileURLToPath(new URL('../dist/browser/', import.meta.url));
const target = fileURLToPath(new URL('../../ui3d/', import.meta.url));
const repository = fileURLToPath(new URL('../../', import.meta.url));
if (target !== resolve(repository, 'ui3d') + (process.platform === 'win32' ? '\\' : '/') || !existsSync(resolve(source, 'index.html'))) {
    throw new Error('Refusing publish: unexpected target or missing build.');
}
mkdirSync(target, {recursive: true});
for (const name of readdirSync(target)) {
    rmSync(resolve(target, name), {recursive: true, force: true});
}
cpSync(source, target, {recursive: true});
console.log('Prepared repository /ui3d/ output. No commit or push performed.');

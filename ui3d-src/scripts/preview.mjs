import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../dist/browser/', import.meta.url));
const types = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
    '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.png': 'image/png'};
const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1:4400');
    if (url.pathname === '/ui3d') {
        response.writeHead(302, {Location: '/ui3d/'}).end();
        return;
    }
    if (!url.pathname.startsWith('/ui3d/')) {
        response.writeHead(404).end('Only /ui3d/ is served by this preview.');
        return;
    }
    const pathname = decodeURIComponent(url.pathname.slice('/ui3d/'.length)) || 'index.html';
    const target = resolve(root, pathname);
    if (!target.startsWith(resolve(root) + (process.platform === 'win32' ? '\\' : '/'))) {
        response.writeHead(403).end();
        return;
    }
    readFile(target).then(bytes => {
        response.writeHead(200, {'Content-Type': types[extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache'}).end(bytes);
    }).catch(() => response.writeHead(404).end('Asset not found.'));
});
server.listen(4400, '127.0.0.1', () => console.log('Production PWA preview: http://127.0.0.1:4400/ui3d/'));

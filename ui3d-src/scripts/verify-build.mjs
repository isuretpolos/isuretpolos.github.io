import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const output = fileURLToPath(new URL('../dist/browser/', import.meta.url));
const manifest = JSON.parse(readFileSync(`${output}/manifest.webmanifest`, 'utf8'));
const worker = JSON.parse(readFileSync(`${output}/ngsw.json`, 'utf8'));
const html = readFileSync(`${output}/index.html`, 'utf8');
assert.ok(existsSync(`${output}/3rdpartylicenses.txt`));
assert.ok(html.includes('<base href="/ui3d/">'));
for (const key of ['id', 'start_url', 'scope']) {
    assert.equal(manifest[key], '/ui3d/');
}
assert.equal(worker.index, '/ui3d/index.html');
assert.ok(Object.keys(worker.hashTable).every(url => url.startsWith('/ui3d/')));
assert.ok(worker.assetGroups.every(group => group.urls.every(url => url.startsWith('/ui3d/')) && group.patterns.length === 0));
assert.equal(worker.dataGroups.length, 0);
for (const icon of manifest.icons) {
    assert.ok(existsSync(`${output}/${icon.src}`));
}
for (const file of ['devices/classic-demo/device.glb', 'decoders/draco/draco_decoder.wasm']) {
    assert.ok(worker.hashTable[`/ui3d/${file}`]);
}
const navigations = worker.navigationUrls;
// Angular strips the registration scope prefix before testing navigation patterns.
const handled = url => {
    if (!url.startsWith('/ui3d/')) {
        return false;
    }
    const relative = url.slice('/ui3d'.length);
    return navigations.some(item => item.positive && new RegExp(item.regex).test(relative))
        && !navigations.some(item => !item.positive && new RegExp(item.regex).test(relative));
};
assert.ok(handled('/ui3d/'));
assert.ok(!handled('/ui/'));
assert.ok(!handled('/'));
assert.ok(!handled('/ui3d/device.json'));
console.log('PASS: base href, manifest, icons, cache URLs, local decoders and navigation scope remain under /ui3d/.');

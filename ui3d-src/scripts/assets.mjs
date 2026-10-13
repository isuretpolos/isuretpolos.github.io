import {copyFileSync, cpSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
mkdirSync(resolve(root, 'public/decoders'), {recursive: true});
cpSync(resolve(root, 'node_modules/three/examples/jsm/libs/draco/gltf'), resolve(root, 'public/decoders/draco'), {recursive: true});
copyFileSync(resolve(root, 'device.schema.json'), resolve(root, 'public/device.schema.json'));
copyFileSync(resolve(root, '../version.json'), resolve(root, 'public/version.json'));
// Dependency licenses accompany the locally bundled decoder assets.
copyFileSync(resolve(root, 'node_modules/three/LICENSE'), resolve(root, 'public/decoders/THREE-LICENSE.txt'));
copyFileSync(resolve(root, 'scripts/DRACO-LICENSE.txt'), resolve(root, 'public/decoders/DRACO-LICENSE.txt'));
copyFileSync(resolve(root, 'scripts/MESHOPT-LICENSE.txt'), resolve(root, 'public/decoders/MESHOPT-LICENSE.txt'));
console.log('Local decoders, schema and release metadata prepared.');

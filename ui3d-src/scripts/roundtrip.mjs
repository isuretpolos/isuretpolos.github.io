import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Camera, Mesh, Quaternion, Vector3} from 'three';
import assert from 'node:assert/strict';

const folder = process.argv[2] ?? fileURLToPath(new URL('../tools/roundtrip-output/', import.meta.url));
const report = JSON.parse(readFileSync(`${folder}/expected.json`, 'utf8'));
const bytes = readFileSync(`${folder}/device.glb`);
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
gltf.scene.updateMatrixWorld(true);
let checked = 0;
for (const expected of report.objects) {
    const object = gltf.scene.getObjectByName(expected.name);
    assert.ok(object, `Missing object ${expected.name}`);
    const position = object.getWorldPosition(new Vector3());
    const scale = object.getWorldScale(new Vector3());
    const quaternion = object.getWorldQuaternion(new Quaternion());
    assert.ok(position.distanceTo(new Vector3().fromArray(expected.position)) < 0.001, `${expected.name}: position/pivot`);
    assert.ok(scale.distanceTo(new Vector3().fromArray(expected.scale)) < 0.001, `${expected.name}: scale`);
    assert.ok(1 - Math.abs(quaternion.dot(new Quaternion().fromArray(expected.quaternion))) < 0.001, `${expected.name}: rotation`);
    if (expected.type === 'CAMERA') {
        assert.ok(object instanceof Camera, `${expected.name}: camera`);
    }
    if (expected.uvs) {
        assert.ok(object instanceof Mesh, `${expected.name}: plane`);
        const uv = object.geometry.getAttribute('uv');
        const pairs = new Set();
        for (let index = 0; index < uv.count; index++) {
            pairs.add(JSON.stringify([Number(uv.getX(index).toFixed(6)), Number(uv.getY(index).toFixed(6))]));
        }
        assert.deepEqual([...pairs].sort(), expected.uvs.map(pair => JSON.stringify(pair)).sort(), `${expected.name}: UVs`);
    }
    checked++;
}
report.clips.forEach(name => assert.ok(gltf.animations.some(clip => clip.name === name), `Missing clip ${name}`));
// Rotate the exported control about converted local Y and verify its pointer stays at the same height.
const cap = gltf.scene.getObjectByName('knob10_1_cap');
assert.ok(cap.scale.y < cap.scale.z, 'Expected converted Blender Z cylinder axle along glTF Y.');
const control = gltf.scene.getObjectByName('knob10_1');
const pointer = gltf.scene.getObjectByName('pointer_1');
const before = pointer.getWorldPosition(new Vector3());
control.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2));
gltf.scene.updateMatrixWorld(true);
const after = pointer.getWorldPosition(new Vector3());
assert.ok(Math.abs(before.y - after.y) < 0.0001 && Math.abs(before.x - after.x) > 0.1, 'Blender Z knob must rotate on the panel, not tilt through it.');
console.log(`PASS: Blender ${report.blenderVersion}; ${checked} names, world transforms/pivots, two cameras, plane UVs, ${report.clips.length} clips, Z → Y geometry conversion.`);

import {deflateSync} from 'node:zlib';
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(name, data) {
    const type = Buffer.from(name);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
    return Buffer.concat([length, type, data, crc]);
}

const folder = fileURLToPath(new URL('../public/icons/', import.meta.url));
mkdirSync(folder, {recursive: true});
for (const size of [192, 512]) {
    const rows = Buffer.alloc((size * 3 + 1) * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const radius = Math.hypot(x - size / 2, y - size / 2) / size;
            const ring = Math.abs(radius - 0.24) < 0.025 || Math.abs(radius - 0.12) < 0.02;
            const pointer = Math.abs(x - size / 2) < size * 0.025 && y > size * 0.25 && y < size * 0.45;
            const color = pointer ? [255, 190, 116] : ring ? [132, 185, 182] : [23, 36, 44];
            const offset = y * (size * 3 + 1) + 1 + x * 3;
            rows.set(color, offset);
        }
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header[8] = 8;
    header[9] = 2;
    writeFileSync(`${folder}/icon-${size}.png`, Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))
    ]));
}

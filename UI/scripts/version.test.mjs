import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bumpVersion } from './version.mjs';

test('semantic version increments reset lower components', () => {
    assert.equal(bumpVersion('1.0.0', 'major'), '2.0.0');
    assert.equal(bumpVersion('1.0.0', 'minor'), '1.1.0');
    assert.equal(bumpVersion('1.0.45', 'bugfix'), '1.0.46');
    assert.equal(bumpVersion('1.3.45', 'minor'), '1.4.0');
    assert.equal(bumpVersion('1.3.45', 'major'), '2.0.0');
    assert.throws(() => bumpVersion('invalid', 'patch'));
    assert.throws(() => bumpVersion('1.0.0', 'unknown'));
});

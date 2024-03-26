const fs = require('fs');
const path = require('path');

/**
 * This is a test to ensure the bigint polyfill patch is applied. It is intended to catch a scenario where the
 * ed25519 library may get updated and we won't get notified through the yarn install.
 */
describe('ed25519 library', () => {
    it('should polyfill bigint', () => {
        const file = fs.readFileSync(path.resolve(`${require.resolve('@noble/ed25519')}/../esm/index.js`)).toString();
        expect(
            file.includes(`const BigInt = typeof globalThis.BigInt !== 'undefined' ? globalThis.BigInt : (() => 0);`)
        ).toBeTruthy();
    });
});

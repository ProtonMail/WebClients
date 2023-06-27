/**
 * This is a test to ensure the bigint polyfill patch is applied. It is intended to catch a scenario where the
 * ed25519 library may get updated and we won't get notified through the yarn install.
 */
describe('pdf-lib', () => {
    it('should use the minified build of @pdf-lib/standard-fonts', () => {
        const file = require('@pdf-lib/standard-fonts/package.json');
        expect(file.module).toBe('dist/standard-fonts.min.js');
        expect(file.main).toBe('dist/standard-fonts.min.js');
        expect(file.unpkg).toBe('dist/standard-fonts.min.js');
    });
});

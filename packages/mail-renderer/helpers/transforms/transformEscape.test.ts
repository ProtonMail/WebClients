import { removeBase64 } from './transformEscape';

describe('Transform escape tests', () => {
    describe('Remove base 64 tests', () => {
        it('should remove png', () => {
            const pngInput = `<p>hello</p><img src="data:image/png;base64,IMAGE_DATA"`;
            const result = removeBase64(pngInput);
            expect(result).not.toContain('img src="data:image/png;base64,IMAGE_DATA"');
            expect(result).toContain('<img data-proton-replace-base');
        });
        it('should remove svg', () => {
            const svgInput = `<p>hello</p><img src="data:image/svg+xml;base64,IMAGE_DATA"`;
            const result = removeBase64(svgInput);
            expect(result).not.toContain('img src="data:image/svg+xml;base64,IMAGE_DATA"');
            expect(result).toContain('<img data-proton-replace-base');
        });
    });
});

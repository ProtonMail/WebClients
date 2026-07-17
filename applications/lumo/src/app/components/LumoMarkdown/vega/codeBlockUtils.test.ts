import { extractCodeBlockText, getCodeBlockLanguage } from './codeBlockUtils';

describe('codeBlockUtils', () => {
    it('joins split markdown code children', () => {
        const text = extractCodeBlockText(['{\n  "$schema": ', '"https://vega.github.io/schema/vega-lite/v5.json"\n}']);
        expect(text).toContain('vega-lite/v5.json');
    });

    it('reads language tags with hyphens from hast class names', () => {
        expect(
            getCodeBlockLanguage(undefined, {
                properties: { className: ['language-vega-lite'] },
            })
        ).toBe('vega-lite');
    });
});

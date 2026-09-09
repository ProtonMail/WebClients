import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';

import sentenceText from './sentenceText';

describe('sentenceText', () => {
    it('reads a sentence built as copy with emphasised placeholders', () => {
        expect(sentenceText(['Move ', sentenceValue('3 emails'), ' to ', sentenceValue('Travel')])).toBe(
            'Move 3 emails to Travel'
        );
    });

    it('reads a plain sentence', () => {
        expect(sentenceText('No emails selected')).toBe('No emails selected');
    });

    it('yields nothing for a sentence a renderer declined to build', () => {
        expect(sentenceText(undefined)).toBe('');
        expect(sentenceText(null)).toBe('');
    });
});

import { convertRefTokensToSpans, removeRefTokens } from './tokens';

describe('removeRefTokens', () => {
    it('should remove [REF] tokens', () => {
        const input = 'This is a [REF]reference[/REF] text.';
        const expected = 'This is a  text.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should remove multiple [REF] tokens', () => {
        const input = 'This is a [REF]first reference[/REF] and a [REF]second reference[/REF] text.';
        const expected = 'This is a  and a  text.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle [REF] tokens at the beginning', () => {
        const input = '[REF]Start reference[/REF] This is a text.';
        const expected = ' This is a text.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle [REF] tokens at the end', () => {
        const input = 'This is a text. [REF]End reference[/REF]';
        const expected = 'This is a text. ';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle text without [REF] tokens', () => {
        const input = 'This is a text without references.';
        const expected = 'This is a text without references.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle empty input', () => {
        const input = '';
        const expected = '';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle input with only [REF] tokens', () => {
        const input = '[REF]Only reference[/REF]';
        const expected = '';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially constructed string with [REF] token at the end', () => {
        const input = 'This is a text. [REF]Partial reference';
        const expected = 'This is a text. ';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially constructed string with multiple [REF] tokens at the end', () => {
        const input = 'This is a [REF]first reference[/REF] and a [REF]second partial reference';
        const expected = 'This is a  and a ';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially constructed string with [REF] token in the middle', () => {
        const input = 'This is a [REF]partial reference[/REF] text. [REF]Another partial reference';
        const expected = 'This is a  text. ';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially constructed string with [REF] token at the beginning', () => {
        const input = '[REF]Partial reference text.';
        const expected = '';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially written [REF] token at the end', () => {
        const inputs = [
            'This is a text. ',
            'This is a text. [',
            'This is a text. [R',
            'This is a text. [RE',
            'This is a text. [REF',
            'This is a text. [REF]',
            'This is a text. [REF]1',
            'This is a text. [REF]1,',
            'This is a text. [REF]1,2',
            'This is a text. [REF]1,2[',
            'This is a text. [REF]1,2[/',
            'This is a text. [REF]1,2[/R',
            'This is a text. [REF]1,2[/RE',
            'This is a text. [REF]1,2[/REF',
            'This is a text. [REF]1,2[/REF]',
        ];
        const expected = 'This is a text. ';
        for (const input of inputs) {
            expect(removeRefTokens(input)).toBe(expected);
        }
    });

    it('should handle partially written [REF] token in the middle', () => {
        const input = 'This is a [R text. [REF]Another partial reference';
        const expected = 'This is a [R text. ';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially written [REF] token at the beginning', () => {
        const input = '[R text.';
        const expected = '[R text.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should ignore case, since some models output [/ref] instead of [/REF]', () => {
        const input = 'Hello [Ref]0[/ref] World';
        const expected = 'Hello  World';
        expect(removeRefTokens(input)).toBe(expected);
    });

    // New tests for SPECIAL tags
    it('should remove <SPECIAL_27> tokens', () => {
        const input = 'This is a <SPECIAL_27>reference<SPECIAL_28> text.';
        const expected = 'This is a  text.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should remove multiple <SPECIAL_27> tokens', () => {
        const input =
            'This is a <SPECIAL_27>first reference<SPECIAL_28> and a <SPECIAL_27>second reference<SPECIAL_28> text.';
        const expected = 'This is a  and a  text.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle <SPECIAL_27> tokens at the beginning', () => {
        const input = '<SPECIAL_27>Start reference<SPECIAL_28> This is a text.';
        const expected = ' This is a text.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle <SPECIAL_27> tokens at the end', () => {
        const input = 'This is a text. <SPECIAL_27>End reference<SPECIAL_28>';
        const expected = 'This is a text. ';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle input with only <SPECIAL_27> tokens', () => {
        const input = '<SPECIAL_27>Only reference<SPECIAL_28>';
        const expected = '';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially constructed string with <SPECIAL_27> token at the end', () => {
        const input = 'This is a text. <SPECIAL_27>Partial reference';
        const expected = 'This is a text. ';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle partially written <SPECIAL_27> token at the end', () => {
        const inputs = [
            'This is a text. <',
            'This is a text. <S',
            'This is a text. <SP',
            'This is a text. <SPE',
            'This is a text. <SPEC',
            'This is a text. <SPECI',
            'This is a text. <SPECIA',
            'This is a text. <SPECIAL',
            'This is a text. <SPECIAL_',
            'This is a text. <SPECIAL_2',
            'This is a text. <SPECIAL_27',
            'This is a text. <SPECIAL_27>',
            'This is a text. <SPECIAL_27>1',
            'This is a text. <SPECIAL_27>1,',
            'This is a text. <SPECIAL_27>1,2',
            'This is a text. <SPECIAL_27>1,2<',
            'This is a text. <SPECIAL_27>1,2<S',
            'This is a text. <SPECIAL_27>1,2<SP',
            'This is a text. <SPECIAL_27>1,2<SPE',
            'This is a text. <SPECIAL_27>1,2<SPEC',
            'This is a text. <SPECIAL_27>1,2<SPECI',
            'This is a text. <SPECIAL_27>1,2<SPECIA',
            'This is a text. <SPECIAL_27>1,2<SPECIAL',
            'This is a text. <SPECIAL_27>1,2<SPECIAL_',
            'This is a text. <SPECIAL_27>1,2<SPECIAL_2',
            'This is a text. <SPECIAL_27>1,2<SPECIAL_28',
            'This is a text. <SPECIAL_27>1,2<SPECIAL_28>',
        ];
        const expected = 'This is a text. ';
        for (const input of inputs) {
            expect(removeRefTokens(input)).toBe(expected);
        }
    });

    it('should handle mixed [REF] and <SPECIAL_27> tokens', () => {
        const input = 'Text with [REF]ref1[/REF] and <SPECIAL_27>ref2<SPECIAL_28> tokens.';
        const expected = 'Text with  and  tokens.';
        expect(removeRefTokens(input)).toBe(expected);
    });

    it('should handle mixed partial [REF] and <SPECIAL_27> tokens', () => {
        const input = 'Text with [REF]ref1 and <SPECIAL_27>ref2';
        const expected = 'Text with ';
        expect(removeRefTokens(input)).toBe(expected);
    });
});

describe('convertRefTokensToSpans', () => {
    it('should convert single REF with multiple numbers to spans', () => {
        const input = 'Hello [REF]0,1,2[/REF] World';
        const expected = 'Hello [0](#ref-0) [1](#ref-1) [2](#ref-2) World';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should convert multiple REFs to spans', () => {
        const input = 'Start [REF]42[/REF] Middle [REF]7,8[/REF] End';
        const expected = 'Start [42](#ref-42) Middle [7](#ref-7) [8](#ref-8) End';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle text without REF tags', () => {
        const input = 'No refs here';
        expect(convertRefTokensToSpans(input)).toBe(input);
    });

    it('should handle empty input', () => {
        expect(convertRefTokensToSpans('')).toBe('');
    });

    it('should handle whitespace in REF content', () => {
        const input = 'Test [REF]1, 2, 3[/REF] spaces';
        const expected = 'Test [1](#ref-1) [2](#ref-2) [3](#ref-3) spaces';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle incomplete REF tags', () => {
        const inputs = ['Text [REF]1,2', 'Text [REF', 'Text [REF]', 'Text [REF]1[/RE'];
        const expected = 'Text ';
        inputs.forEach((input) => {
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });
    });

    it('should ignore case in the closing ref', () => {
        const input = 'Hello [REF]0[/ref] World';
        const expected = 'Hello [0](#ref-0) World';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle empty REF tags', () => {
        const input = 'Empty [REF][/REF] tag';
        const expected = 'Empty  tag';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle REF tags with empty values in comma-separated list', () => {
        const input = 'Test [REF]1,,2,,[/REF] commas';
        const expected = 'Test [1](#ref-1) [2](#ref-2) commas';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    // New tests for SPECIAL tags
    it('should convert single SPECIAL with multiple numbers to spans', () => {
        const input = 'Hello <SPECIAL_27>0,1,2<SPECIAL_28> World';
        const expected = 'Hello [0](#ref-0) [1](#ref-1) [2](#ref-2) World';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should convert multiple SPECIALs to spans', () => {
        const input = 'Start <SPECIAL_27>42<SPECIAL_28> Middle <SPECIAL_27>7,8<SPECIAL_28> End';
        const expected = 'Start [42](#ref-42) Middle [7](#ref-7) [8](#ref-8) End';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle whitespace in SPECIAL content', () => {
        const input = 'Test <SPECIAL_27>1, 2, 3<SPECIAL_28> spaces';
        const expected = 'Test [1](#ref-1) [2](#ref-2) [3](#ref-3) spaces';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle incomplete SPECIAL tags', () => {
        const inputs = [
            'Text <SPECIAL_27>1,2',
            'Text <SPECIAL_27',
            'Text <SPECIAL_27>',
            'Text <SPECIAL_27>1<SPECIAL_2',
        ];
        const expected = 'Text ';
        inputs.forEach((input) => {
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });
    });

    it('should handle mixed REF and SPECIAL tags', () => {
        const input = 'Mixed [REF]1[/REF] and <SPECIAL_27>2<SPECIAL_28> refs';
        const expected = 'Mixed [1](#ref-1) and [2](#ref-2) refs';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle mixed REF and SPECIAL tags with multiple numbers', () => {
        const input = 'Complex [REF]1,2[/REF] and <SPECIAL_27>3,4,5<SPECIAL_28> example';
        const expected = 'Complex [1](#ref-1) [2](#ref-2) and [3](#ref-3) [4](#ref-4) [5](#ref-5) example';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle mixed incomplete REF and SPECIAL tags', () => {
        const input = 'Text with [REF]1,2 and <SPECIAL_27>3,4';
        const expected = 'Text with ';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle SPECIAL tags with single numbers', () => {
        const input = 'Single <SPECIAL_27>42<SPECIAL_28> reference';
        const expected = 'Single [42](#ref-42) reference';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle empty SPECIAL tags', () => {
        const input = 'Empty <SPECIAL_27><SPECIAL_28> tag';
        const expected = 'Empty  tag';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should handle SPECIAL tags with empty values in comma-separated list', () => {
        const input = 'Test <SPECIAL_27>1,,2,,<SPECIAL_28> commas';
        const expected = 'Test [1](#ref-1) [2](#ref-2) commas';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });
});

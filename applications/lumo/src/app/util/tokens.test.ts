import { convertRefTokensToSpans } from './tokens';

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

    // Tests for CJK square bracket format 【REF]3[/REF]
    describe('CJK square bracket formats', () => {
        it('should handle CJK opening bracket 【REF]3[/REF]', () => {
            const input = 'Text 【REF]3[/REF] more text';
            const expected = 'Text [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle CJK opening bracket with normal closing 【REF]3[/ref]', () => {
            const input = 'Text 【REF]3[/ref] more text';
            const expected = 'Text [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle normal opening with CJK closing [REF]3【/REF]', () => {
            const input = 'Text [REF]3【/REF] more text';
            const expected = 'Text [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle both CJK brackets 【REF]3【/REF]', () => {
            const input = 'Text 【REF]3【/REF] more text';
            const expected = 'Text [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle case variations with CJK brackets 【ref]3[/REF]', () => {
            const input = 'Text 【ref]3[/REF] more text';
            const expected = 'Text [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle case variations with CJK brackets [REF]3【/ref]', () => {
            const input = 'Text [REF]3【/ref] more text';
            const expected = 'Text [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle all CJK case combinations 【ref]3【/ref]', () => {
            const input = 'Text 【ref]3【/ref] more text';
            const expected = 'Text [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle multiple numbers with CJK brackets 【REF]1,2,3[/REF]', () => {
            const input = 'Text 【REF]1,2,3[/REF] more text';
            const expected = 'Text [1](#ref-1) [2](#ref-2) [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle multiple CJK bracket tags', () => {
            const input = 'Start 【REF]1[/REF] middle [REF]2【/REF] end 【REF]3【/REF] text';
            const expected = 'Start [1](#ref-1) middle [2](#ref-2) end [3](#ref-3) text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle incomplete CJK bracket tags', () => {
            const inputs = ['Text 【REF]1,2', 'Text 【REF', 'Text 【REF]', 'Text 【REF]1【/RE', 'Text [REF]1【/REF'];
            const expected = 'Text ';
            inputs.forEach((input) => {
                expect(convertRefTokensToSpans(input)).toBe(expected);
            });
        });
    });

    // Tests for dagger format [4†ref] (no closing element)
    describe('dagger format', () => {
        it('should handle dagger format [4†ref]', () => {
            const input = 'Text [4†ref] more text';
            const expected = 'Text [4](#ref-4) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle dagger format with CJK opening bracket 【4†ref]', () => {
            const input = 'Text 【4†ref] more text';
            const expected = 'Text [4](#ref-4) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle dagger format case variations [4†REF]', () => {
            const input = 'Text [4†REF] more text';
            const expected = 'Text [4](#ref-4) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle dagger format case variations [4†Ref]', () => {
            const input = 'Text [4†Ref] more text';
            const expected = 'Text [4](#ref-4) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle dagger format with CJK bracket and case 【4†REF]', () => {
            const input = 'Text 【4†REF] more text';
            const expected = 'Text [4](#ref-4) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle multiple dagger refs', () => {
            const input = 'Start [1†ref] middle 【2†REF] end [3†Ref] text';
            const expected = 'Start [1](#ref-1) middle [2](#ref-2) end [3](#ref-3) text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle mixed dagger and normal refs', () => {
            const input = 'Normal [REF]1[/REF] and dagger [2†ref] and CJK 【REF]3[/REF] refs';
            const expected = 'Normal [1](#ref-1) and dagger [2](#ref-2) and CJK [3](#ref-3) refs';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle multiple numbers in dagger format (comma separated)', () => {
            const input = 'Text [1,2,3†ref] more text';
            const expected = 'Text [1](#ref-1) [2](#ref-2) [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle dagger format with whitespace [4 †ref]', () => {
            const input = 'Text [4 †ref] more text';
            const expected = 'Text [4](#ref-4) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle dagger format with whitespace in numbers [1, 2, 3†ref]', () => {
            const input = 'Text [1, 2, 3†ref] more text';
            const expected = 'Text [1](#ref-1) [2](#ref-2) [3](#ref-3) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        it('should handle dagger format with lines quoting [4†L2-L3]', () => {
            const input = 'Text [4†L2-L3] more text';
            const expected = 'Text [4](#ref-4) more text';
            expect(convertRefTokensToSpans(input)).toBe(expected);
        });

        // Comprehensive test for all bracket/case combinations
        it('should handle all combinations of brackets and cases', () => {
            const openBrackets = ['[', '【'];
            const closeBrackets = [']', '】'];
            const refCases = ['REF', 'ref', 'Ref'];
            const daggerCases = ['ref', 'REF', 'Ref', 'L2-L3'];

            // Test standard REF format combinations
            openBrackets.forEach((openBracket) => {
                closeBrackets.forEach((closeBracket) => {
                    refCases.forEach((refCase) => {
                        refCases.forEach((closeRefCase) => {
                            const input = `Text ${openBracket}${refCase}${closeBracket}42${openBracket}/${closeRefCase}${closeBracket} more text`;
                            const expected = 'Text [42](#ref-42) more text';
                            expect(convertRefTokensToSpans(input)).toBe(expected);
                        });
                    });
                });
            });

            // Test dagger format combinations
            openBrackets.forEach((openBracket) => {
                closeBrackets.forEach((closeBracket) => {
                    daggerCases.forEach((daggerCase) => {
                        const input = `Text ${openBracket}42†${daggerCase}${closeBracket} more text`;
                        const expected = 'Text [42](#ref-42) more text';
                        expect(convertRefTokensToSpans(input)).toBe(expected);
                    });
                });
            });
        });
    });

    // Test for dropping bold square brackets without dagger or REF format
    it('should drop bold square brackets without a dagger or REF format', () => {
        // Note NNBSP spaces inside the brackets below
        const input = 'Text 【proton_info snippet "Get Lumo Plus … $12.99/month"】 more text';
        const expected = 'Text  more text';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should truncate partial bold square brackets without closing bracket', () => {
        const input = 'Text 【proton_info snippet "Get Lumo Plus';
        const expected = 'Text ';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should insert a space between a bare URL and a following ref link', () => {
        const input = 'Visit https://www.example.com/page[REF]3[/REF] for more info';
        const expected = 'Visit https://www.example.com/page [3](#ref-3) for more info';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should not add an extra space when ref link already has a preceding space', () => {
        const input = 'Visit https://www.example.com/page [REF]3[/REF] for more info';
        const expected = 'Visit https://www.example.com/page [3](#ref-3) for more info';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });

    it('should insert a space between a bare URL and a following dagger ref link', () => {
        const input = 'See https://www.proton.me/blog/drive-for-linux[3†ref] for details';
        const expected = 'See https://www.proton.me/blog/drive-for-linux [3](#ref-3) for details';
        expect(convertRefTokensToSpans(input)).toBe(expected);
    });
});

// Helper function to convert comma-separated numbers to markdown links
function numbersToMarkdownLinks(numbersStr: string): string {
    // Handle empty content
    if (!numbersStr.trim()) {
        return '';
    }
    // Split by comma and create links for each number
    const numbers = numbersStr
        .split(',')
        .map((n: string) => n.trim())
        .filter((n: string) => n);
    return numbers.map((num: string) => `[${num}](#ref-${num})`).join(' ');
}

export function convertRefTokensToSpans(content: string) {
    // Replace complete REF tags with markdown links (including CJK brackets)
    content = content.replace(/[\[【]REF[\]】]([^[\[【]*?)[\[【]\/REF[\]】]/gi, (match, numbersStr) => {
        return numbersToMarkdownLinks(numbersStr);
    });

    // Replace dagger format [4†ref] with markdown links (including CJK brackets)
    content = content.replace(/[\[【]([^[\[【\]】]*?)\s*†\s*[^\]】]*[\]】]/gi, (match, numbersStr) => {
        return numbersToMarkdownLinks(numbersStr);
    });

    // Replace complete SPECIAL tags with markdown links
    content = content.replace(/<SPECIAL_27>([^<]*)<SPECIAL_28>/gi, (match, numbersStr) => {
        return numbersToMarkdownLinks(numbersStr);
    });

    // Clean up any incomplete/malformed REF tags (including CJK brackets)
    content = content.replaceAll(/[\[【](R(E(F([\]】]([^[\[【]*([\[【](\/(R(E(F([\]】])?)?)?)?)?)?)?)?)?)?)?$/gi, '');

    // Clean up any incomplete/malformed SPECIAL tags
    content = content.replaceAll(
        /<(S(P(E(C(I(A(L(_(2(7(>([^<]*(<(S(P(E(C(I(A(L(_(2(8(>)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?$/gi,
        ''
    );
    return content;
}

// Keep the original function for backward compatibility
export function removeRefTokens(content: string) {
    // Remove complete REF tags (including CJK brackets)
    content = content.replaceAll(/[\[【]REF[\]】][^[\[【]*[\[【]\/REF[\]】]/gi, '');

    // Remove dagger format (including CJK brackets)
    content = content.replaceAll(/[\[【][^[\[【\]】]*?\s*†\s*(ref|REF|Ref)[\]】]/gi, '');

    // Remove complete SPECIAL tags
    content = content.replaceAll(/<SPECIAL_27>[^<]*<SPECIAL_28>/gi, '');

    // Remove incomplete REF tags (including CJK brackets)
    content = content.replaceAll(/[\[【](R(E(F([\]】]([^[\[【]*([\[【](\/(R(E(F([\]】])?)?)?)?)?)?)?)?)?)?)?$/gi, '');

    // Remove incomplete SPECIAL tags
    content = content.replaceAll(
        /<(S(P(E(C(I(A(L(_(2(7(>([^<]*(<(S(P(E(C(I(A(L(_(2(8(>)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?$/gi,
        ''
    );

    return content;
}

// Test function to verify the conversion
export function testRefToSpanConversion() {
    const testCases = [
        {
            input: 'Hello [REF]0,1,2[/REF] World',
            expected: 'Hello [0](#ref-0) [1](#ref-1) [2](#ref-2) World',
        },
        {
            input: 'Start [REF]42[/REF] Middle [REF]7,8[/REF] End',
            expected: 'Start [42](#ref-42) Middle [7](#ref-7) [8](#ref-8) End',
        },
        {
            input: 'Hello <SPECIAL_27>0,1,2<SPECIAL_28> World',
            expected: 'Hello [0](#ref-0) [1](#ref-1) [2](#ref-2) World',
        },
        {
            input: 'Start <SPECIAL_27>42<SPECIAL_28> Middle <SPECIAL_27>7,8<SPECIAL_28> End',
            expected: 'Start [42](#ref-42) Middle [7](#ref-7) [8](#ref-8) End',
        },
        {
            input: 'Mixed [REF]1[/REF] and <SPECIAL_27>2<SPECIAL_28> refs',
            expected: 'Mixed [1](#ref-1) and [2](#ref-2) refs',
        },
        {
            input: 'No refs here',
            expected: 'No refs here',
        },
    ];

    testCases.forEach((testCase, index) => {
        const result = convertRefTokensToSpans(testCase.input);
        const passed = result === testCase.expected;
        console.log(`Test ${index + 1}:`);
        console.log(`Input:    ${testCase.input}`);
        console.log(`Expected: ${testCase.expected}`);
        console.log(`Got:      ${result}`);
        console.log(`Status:   ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
        console.log('---');
    });
}

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

    // Remove any remaining complete bold square brackets (catch-all for non-REF/non-dagger patterns)
    content = content.replaceAll(/【[^】]*?】/g, '');

    // Clean up any incomplete/malformed REF tags (including CJK brackets)
    content = content.replaceAll(/[\[【](R(E(F([\]】]([^[\[【]*([\[【](\/(R(E(F([\]】])?)?)?)?)?)?)?)?)?)?)?$/gi, '');

    // Clean up any incomplete/malformed SPECIAL tags
    content = content.replaceAll(
        /<(S(P(E(C(I(A(L(_(2(7(>([^<]*(<(S(P(E(C(I(A(L(_(2(8(>)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?$/gi,
        ''
    );

    // Remove any incomplete bold square brackets at the end
    content = content.replaceAll(/【[^】]*$/g, '');

    // Ensure ref links are separated from preceding non-whitespace characters (e.g. bare URLs).
    // `https://example.com[3](#ref-3)` would be parsed as one invalid autolink URL.
    content = content.replace(/(\S)(\[\d+\]\(#ref-\d+\))/g, '$1 $2');

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

    // Remove any remaining complete bold square brackets (catch-all for non-REF/non-dagger patterns)
    content = content.replaceAll(/【[^】]*?】/g, '');

    // Remove incomplete REF tags (including CJK brackets)
    content = content.replaceAll(/[\[【](R(E(F([\]】]([^[\[【]*([\[【](\/(R(E(F([\]】])?)?)?)?)?)?)?)?)?)?)?$/gi, '');

    // Remove incomplete SPECIAL tags
    content = content.replaceAll(
        /<(S(P(E(C(I(A(L(_(2(7(>([^<]*(<(S(P(E(C(I(A(L(_(2(8(>)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?$/gi,
        ''
    );

    // Remove any incomplete bold square brackets at the end
    content = content.replaceAll(/【[^】]*$/g, '');

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

// replace \Bigl and \Bigr with \left and \right to prevent rendering different size parentheses
export function processForLatexParentheses(markdown: string) {
    return markdown.replace(/\\Bigl/g, '\\left').replace(/\\Bigr/g, '\\right');
}

/**
 * Previously replaced <br> tags with spaces, but this caused bullet points
 * separated by <br> inside table cells to collapse into a single line.
 * <br> tags are now handled by the remarkBrToBreak remark plugin in the
 * markdown renderer, which converts them to proper AST break nodes.
 */
export function normalizeBrTags(markdown: string): string {
    return markdown;
}

// remark-math does not natively support latex delimiters like \(, \[, \\(, etc so we must convert both block-level and inline LaTeX delimiters \[ \] and \( \)
//  to markdown-style math delimiters $$
// for more information see https://github.com/remarkjs/react-markdown/issues/785
export const processForLatexMarkdown = (content: string) => {
    const processedContent = processForLatexParentheses(content);
    const blockProcessedContent = processedContent.replace(/\\\[(.*?)\\\]/gs, (_, equation) => `$$${equation}$$`);
    const inlineProcessedContent = blockProcessedContent.replace(/\\\((.*?)\\\)/gs, (_, equation) => `$$${equation}$$`);

    return inlineProcessedContent;
};

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

    // When a model outputs a bare URL immediately followed by a ref, the URL already provides
    // the link — rendering the ref badge alongside it would be redundant (double-rendering the
    // same source).  Drop the ref and keep only the URL.
    // Note: any leading/trailing whitespace captured between them is also discarded.
    content = content.replace(/(https?:\/\/\S+?)(\s*)(\[\d+\]\(#ref-\d+\))/g, '$1');

    // Ensure ref links are separated from any other preceding non-whitespace character
    // (e.g. consecutive refs `[3](#ref-3)[4](#ref-4)` → `[3](#ref-3) [4](#ref-4)`).
    content = content.replace(/(\S)(\[\d+\]\(#ref-\d+\))/g, '$1 $2');

    return content;
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

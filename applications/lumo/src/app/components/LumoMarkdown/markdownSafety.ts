/**
 * Guards for the markdown pipeline against "too much recursion" / "Maximum call stack size exceeded"
 * (Sentry: micromark-util-character, getToolCallLabel -> ThinkingPath misattribution).
 *
 * Two sources are covered:
 * - Our own block splitter used a regex with a lookahead inside a repeated group, which recurses in
 *   SpiderMonkey/JavaScriptCore on long lines. `findSingleLineParagraphEnd` is a linear replacement.
 * - micromark/remark recurse on deeply nested structures (hundreds of nested block quotes, brackets,
 *   ...). `isPathologicalMarkdown` detects such input so it can be shown as plain text instead.
 */

/** Longest run of a single nesting character we still hand to the markdown parser. */
const MAX_NESTING_RUN = 64;
/** Deepest chain of leading block-quote markers (`> > > `) we still hand to the markdown parser. */
const MAX_BLOCKQUOTE_DEPTH = 32;

const NESTING_CHARS = new Set(['>', '[', ']', '(', ')', '<', '!']);

/**
 * Returns the end index (exclusive, after the trailing blank line) of a one-line paragraph at the start
 * of `text`, or null. Same rules as `/^((?:(?!\n\n|```|\|[^\n]+\|).)+)(\n\n)/` without regex backtracking:
 * a non-empty single line, no code fence marker, no `|...|` table-looking span, followed by `\n\n`.
 * Like the regex's `.`, the line must not contain `\r`, `\u2028` or `\u2029`.
 */
export function findSingleLineParagraphEnd(text: string): number | null {
    const lineEnd = text.indexOf('\n');
    if (lineEnd <= 0 || !text.startsWith('\n\n', lineEnd)) {
        return null;
    }

    const line = text.slice(0, lineEnd);
    if (line.includes('```') || /[\r\u2028\u2029]/.test(line)) {
        return null;
    }

    const firstPipe = line.indexOf('|');
    if (firstPipe !== -1 && line.lastIndexOf('|') - firstPipe >= 2) {
        return null;
    }

    return lineEnd + 2;
}

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;

/**
 * True when the content would nest deeply enough to risk blowing the parser's call stack.
 *
 * Fenced code blocks are skipped: the parser treats their content as opaque text, so a long run of
 * `)` in Lisp or `!!!!` in a banner there is harmless. An unclosed fence (normal while streaming)
 * runs to the end of the text, as it does for the parser. Inline code spans, indented code blocks
 * and fences inside block quotes are still scanned.
 */
export function isPathologicalMarkdown(content: string): boolean {
    let fence: { char: string; length: number } | null = null;
    let lineStart = 0;

    while (lineStart <= content.length) {
        const newline = content.indexOf('\n', lineStart);
        const lineEnd = newline === -1 ? content.length : newline;
        const line = content.slice(lineStart, lineEnd);

        if (fence) {
            const trimmed = line.replace(/^ {0,3}/, '').trimEnd();
            if (trimmed.length >= fence.length && trimmed === fence.char.repeat(trimmed.length)) {
                fence = null;
            }
        } else {
            const open = FENCE_OPEN.exec(line);
            // A backtick fence's info string cannot contain backticks (otherwise it is inline code).
            if (open && !(open[1][0] === '`' && line.slice(open[0].length).includes('`'))) {
                fence = { char: open[1][0], length: open[1].length };
            } else if (isPathologicalLine(line)) {
                return true;
            }
        }

        if (newline === -1) {
            break;
        }
        lineStart = newline + 1;
    }

    return false;
}

function isPathologicalLine(line: string): boolean {
    // Long runs of one nesting character.
    let run = 0;
    let runChar = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (NESTING_CHARS.has(char) && char === runChar) {
            run++;
            if (run > MAX_NESTING_RUN) {
                return true;
            }
        } else {
            run = 1;
            runChar = NESTING_CHARS.has(char) ? char : '';
        }
    }

    // Nested block quotes: `> > > > text`, also interleaved with spaces.
    let depth = 0;
    for (let i = 0; i < line.length && (line[i] === '>' || line[i] === ' '); i++) {
        if (line[i] === '>' && ++depth > MAX_BLOCKQUOTE_DEPTH) {
            return true;
        }
    }

    return false;
}

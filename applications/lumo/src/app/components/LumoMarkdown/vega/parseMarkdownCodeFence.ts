export type MarkdownCodeFenceSegment =
    { type: 'markdown'; content: string } | { type: 'code'; language: string; code: string };

export type MarkdownCodeFence = {
    start: number;
    end: number;
    language: string;
    code: string;
};

const OPENING_FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)(?:\r?\n|$)/gm;

/**
 * Find the next complete CommonMark fenced code block.
 *
 * An unclosed fence consumes the rest of the document, so its contents must not
 * be searched for another opening fence.
 */
export function findCompleteMarkdownCodeFence(content: string, fromIndex = 0): MarkdownCodeFence | null {
    OPENING_FENCE_PATTERN.lastIndex = fromIndex;

    for (let opening = OPENING_FENCE_PATTERN.exec(content); opening; opening = OPENING_FENCE_PATTERN.exec(content)) {
        const marker = opening[1]!;
        const infoString = opening[2]!.trim();

        // CommonMark forbids backticks in the info string of a backtick fence.
        if (marker[0] === '`' && infoString.includes('`')) {
            continue;
        }

        const markerCharacter = marker[0]!;
        const closingFencePattern = new RegExp(`^ {0,3}${markerCharacter}{${marker.length},}[ \\t]*(?=\\r?$)`, 'gm');
        closingFencePattern.lastIndex = OPENING_FENCE_PATTERN.lastIndex;
        const closing = closingFencePattern.exec(content);

        if (!closing) {
            return null;
        }

        return {
            start: opening.index,
            end: closing.index + closing[0].length,
            language: (infoString.split(/\s+/)[0] ?? '').toLowerCase(),
            code: content.slice(OPENING_FENCE_PATTERN.lastIndex, closing.index).replace(/\r?\n$/, ''),
        };
    }

    return null;
}

/**
 * Parse a block that consists entirely of one markdown code fence (as produced by
 * `splitIntoBlocks` for complete code blocks).
 */
export function parseMarkdownCodeFence(blockContent: string): { language: string; code: string } | null {
    const trimmed = blockContent.trim();
    const fence = findCompleteMarkdownCodeFence(trimmed);
    if (!fence || fence.start !== 0 || fence.end !== trimmed.length) {
        return null;
    }

    return {
        language: fence.language,
        code: fence.code,
    };
}

/**
 * Split markdown into prose segments and complete fenced code blocks so Vega charts
 * can be rendered without relying on react-markdown's code component.
 */
export function splitMarkdownWithCompleteCodeFences(content: string): MarkdownCodeFenceSegment[] {
    const segments: MarkdownCodeFenceSegment[] = [];
    let lastIndex = 0;

    while (lastIndex < content.length) {
        const fence = findCompleteMarkdownCodeFence(content, lastIndex);
        if (!fence) {
            break;
        }

        if (fence.start > lastIndex) {
            segments.push({
                type: 'markdown',
                content: content.slice(lastIndex, fence.start),
            });
        }

        segments.push({
            type: 'code',
            language: fence.language,
            code: fence.code,
        });

        lastIndex = fence.end;
    }

    if (lastIndex < content.length) {
        segments.push({
            type: 'markdown',
            content: content.slice(lastIndex),
        });
    }

    return segments;
}

export function blockContainsCompleteCodeFence(content: string): boolean {
    return findCompleteMarkdownCodeFence(content) !== null;
}

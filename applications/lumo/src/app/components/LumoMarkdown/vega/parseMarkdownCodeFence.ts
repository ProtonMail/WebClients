export type MarkdownCodeFenceSegment =
    | { type: 'markdown'; content: string }
    | { type: 'code'; language: string; code: string };

const COMPLETE_CODE_FENCE_PATTERN = /```([\w-]+)?[ \t]*\n([\s\S]*?)\n```/g;

/**
 * Parse a block that consists entirely of one markdown code fence (as produced by
 * `splitIntoBlocks` for complete code blocks).
 */
export function parseMarkdownCodeFence(blockContent: string): { language: string; code: string } | null {
    const trimmed = blockContent.trim();
    const match = trimmed.match(/^```([\w-]+)?[ \t]*\n([\s\S]*)\n```$/);
    if (!match) {
        return null;
    }

    return {
        language: (match[1] ?? '').toLowerCase(),
        code: match[2]!.replace(/\n$/, ''),
    };
}

/**
 * Split markdown into prose segments and complete fenced code blocks so Vega charts
 * can be rendered without relying on react-markdown's code component.
 */
export function splitMarkdownWithCompleteCodeFences(content: string): MarkdownCodeFenceSegment[] {
    const segments: MarkdownCodeFenceSegment[] = [];
    let lastIndex = 0;

    COMPLETE_CODE_FENCE_PATTERN.lastIndex = 0;

    for (const match of content.matchAll(COMPLETE_CODE_FENCE_PATTERN)) {
        const fenceStart = match.index ?? 0;

        if (fenceStart > lastIndex) {
            segments.push({
                type: 'markdown',
                content: content.slice(lastIndex, fenceStart),
            });
        }

        segments.push({
            type: 'code',
            language: (match[1] ?? '').toLowerCase(),
            code: match[2]!.replace(/\n$/, ''),
        });

        lastIndex = fenceStart + match[0].length;
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
    COMPLETE_CODE_FENCE_PATTERN.lastIndex = 0;
    return COMPLETE_CODE_FENCE_PATTERN.test(content);
}

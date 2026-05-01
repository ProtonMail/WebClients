function getTableCells(line: string): string[] {
    const trimmed = line.trim();

    if (!trimmed.includes('|')) {
        return [];
    }

    return trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|');
}

function isTableDelimiterLine(line: string): boolean {
    const cells = getTableCells(line);

    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function isTableHeaderLine(line: string, nextLine: string | undefined): boolean {
    if (!nextLine || !line.includes('|') || isTableDelimiterLine(line)) {
        return false;
    }

    return isTableDelimiterLine(nextLine);
}

/**
 * GFM tables cannot interrupt paragraphs. LLMs often emit a title followed
 * immediately by a table, so add the blank line the parser needs.
 */
export function normalizeGfmTableSpacing(markdown: string): string {
    const lines = markdown.split('\n');
    const normalized: string[] = [];
    let fenceMarker: '`' | '~' | null = null;

    lines.forEach((line, index) => {
        const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);

        if (
            !fenceMarker &&
            isTableHeaderLine(line, lines[index + 1]) &&
            normalized.length > 0 &&
            normalized[normalized.length - 1].trim() !== ''
        ) {
            normalized.push('');
        }

        normalized.push(line);

        if (!fenceMatch) {
            return;
        }

        const marker = fenceMatch[1][0] as '`' | '~';

        if (!fenceMarker) {
            fenceMarker = marker;
            return;
        }

        if (fenceMarker === marker) {
            fenceMarker = null;
        }
    });

    return normalized.join('\n');
}

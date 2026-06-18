import { Role, type Turn } from './types';

export const TITLE_MAX_LINES = 4;

export function extractTitleSourceText(turns: Turn[], maxLines = TITLE_MAX_LINES): string | null {
    const userTurns = turns.filter((turn) => turn.role === Role.User);

    for (let i = userTurns.length - 1; i >= 0; i--) {
        const content = userTurns[i]?.content?.trim() ?? '';
        if (!content || isAttachmentTurnContent(content)) {
            continue;
        }

        return truncateLines(content, maxLines);
    }

    const fallback = userTurns.find((turn) => turn.content?.trim())?.content?.trim();
    return fallback ? truncateLines(fallback, maxLines) : null;
}

function isAttachmentTurnContent(content: string): boolean {
    return (
        content.startsWith('----- BEGIN FILE') ||
        content.startsWith('File contents:') ||
        content.startsWith('<lumo-image')
    );
}

function truncateLines(content: string, maxLines: number): string {
    const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    return lines.slice(0, maxLines).join('\n');
}

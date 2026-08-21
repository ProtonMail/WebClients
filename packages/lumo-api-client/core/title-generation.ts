import { Role, type Turn } from './types';

export const TITLE_MAX_LINES = 4;
const ATTACHMENT_LINE_MAX_CHARS = 256;
const ATTACHMENT_HEAD_LINES = 3;
const ATTACHMENT_TAIL_LINES = 3;

function isFileAttachmentTurnContent(content: string): boolean {
    return content.startsWith('Filename:');
}

function isImageAttachmentTurnContent(content: string): boolean {
    return content.startsWith('<lumo-image');
}

function truncateLines(content: string, maxLines: number): string {
    const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    return lines.slice(0, maxLines).join('\n');
}

function truncateFileAttachmentContent(content: string): string {
    const beginMarker = '----- BEGIN FILE CONTENTS -----';
    const endMarker = '----- END FILE CONTENTS -----';

    const beginIdx = content.indexOf(beginMarker);
    const endIdx = content.indexOf(endMarker);

    if (beginIdx === -1 || endIdx === -1) {
        return content;
    }

    const metadata = content.slice(0, beginIdx).trimEnd();
    const fileContent = content.slice(beginIdx + beginMarker.length, endIdx).trim();

    const lines = fileContent.split('\n').filter(Boolean);
    const capLine = (line: string) =>
        line.length > ATTACHMENT_LINE_MAX_CHARS ? line.slice(0, ATTACHMENT_LINE_MAX_CHARS) + '…' : line;

    let contentBlock: string;
    if (lines.length <= ATTACHMENT_HEAD_LINES + ATTACHMENT_TAIL_LINES) {
        contentBlock = lines.map(capLine).join('\n');
    } else {
        const head = lines.slice(0, ATTACHMENT_HEAD_LINES).map(capLine);
        const tail = lines.slice(-ATTACHMENT_TAIL_LINES).map(capLine);
        contentBlock = [...head, '[... truncated ...]', ...tail].join('\n');
    }

    return [metadata, beginMarker, contentBlock, endMarker].join('\n');
}

export function extractTitleSourceText(turns: Turn[], maxLines = TITLE_MAX_LINES): string | null {
    const userTurns = turns.filter((turn) => turn.role === Role.User);

    const parts: string[] = [];
    for (const turn of userTurns) {
        const content = turn.content?.trim() ?? '';
        if (!content || isImageAttachmentTurnContent(content)) {
            continue;
        }
        if (isFileAttachmentTurnContent(content)) {
            parts.push(truncateFileAttachmentContent(content));
        } else {
            parts.push(truncateLines(content, maxLines));
        }
    }

    return parts.length > 0 ? parts.join('\n') : null;
}

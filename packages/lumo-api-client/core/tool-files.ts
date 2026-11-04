import type { ClientToolResult, ToolFileProcessor } from './client-tools';

/** Identify the processed thumbnail format rather than assuming its source MIME. */
export function toolImageMimeType(data: string): string | undefined {
    const header = atob(data.slice(0, 16));
    if (header.startsWith('\x89PNG\r\n\x1a\n')) return 'image/png';
    if (header.startsWith('\xff\xd8\xff')) return 'image/jpeg';
    if (header.startsWith('GIF87a') || header.startsWith('GIF89a')) return 'image/gif';
    if (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') return 'image/webp';
    if (header.startsWith('BM')) return 'image/bmp';
    return undefined;
}

/** Process executor-supplied files before recording history. Text is never a transport envelope. */
export async function processToolFileResult(
    result: ClientToolResult,
    processor?: ToolFileProcessor
): Promise<ClientToolResult> {
    if (!result.files?.length) return result;
    const { files, ...processedResult } = result;
    const parts = result.content ? [result.content] : [];
    const images = [...(result.images ?? [])];
    let isError = result.is_error === true;
    let endTurn = result.endTurn;
    for (const attachment of files) {
        try {
            if (!processor) throw new Error('This client has no attachment processor for tool-read files.');
            let converted = await processor(attachment.file);
            if (!converted.is_error && attachment.onProcessed) {
                converted = await attachment.onProcessed(converted);
            }
            if (converted.content) parts.push(converted.content);
            if (converted.images) images.push(...converted.images);
            isError ||= converted.is_error === true;
            endTurn ||= converted.endTurn;
        } catch (error) {
            parts.push(JSON.stringify({ error: error instanceof Error ? error.message : 'File processing failed.' }));
            isError = true;
        }
    }
    return {
        ...processedResult,
        content: parts.join('\n'),
        ...(images.length ? { images } : {}),
        is_error: isError,
        ...(endTurn ? { endTurn } : {}),
    };
}

import type { ShallowAttachment, SpaceId } from '../types';

export { lumoImageMarker } from '@proton/lumo-api-client';

export function isGeneratedImageAttachment(attachment: { role?: 'user' | 'assistant'; mimeType?: string }): boolean {
    return attachment.role === 'assistant' && (attachment.mimeType?.startsWith('image/') ?? false);
}

/**
 * Build a human-friendly base name (no extension) for a generated image, based on the
 * time it was created, e.g. "Lumo generated 2026-06-29 17.42".
 */
function generatedImageBaseName(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    // Colons are not filesystem-safe, so use dots between hours and minutes.
    const timePart = `${pad(date.getHours())}.${pad(date.getMinutes())}`;
    return `Lumo generated ${datePart} ${timePart}`;
}

/**
 * Resolve a filename against a set of names already in use, appending " (2)", " (3)", …
 * before the extension until it is unique. Matching is case-insensitive to mirror how
 * users perceive filenames.
 */
export function resolveFilenameCollision(filename: string, existingFilenames: Iterable<string>): string {
    const taken = new Set<string>();
    for (const name of existingFilenames) {
        taken.add(name.toLowerCase());
    }
    if (!taken.has(filename.toLowerCase())) {
        return filename;
    }

    const dotIndex = filename.lastIndexOf('.');
    const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
    const ext = dotIndex > 0 ? filename.slice(dotIndex) : '';

    let counter = 2;
    let candidate = `${base} (${counter})${ext}`;
    while (taken.has(candidate.toLowerCase())) {
        counter += 1;
        candidate = `${base} (${counter})${ext}`;
    }
    return candidate;
}

/**
 * Helper to create an assistant-generated image attachment from base64 data.
 *
 * The filename is derived from the creation time (e.g. "Lumo generated 2026-06-29 17.42.png").
 * Pass `existingFilenames` (the filenames already present in the space) so colliding names
 * are disambiguated with " (2)", " (3)", … suffixes.
 */
export function createImageAttachment(
    imageId: string,
    base64Data: string,
    spaceId: SpaceId,
    existingFilenames: Iterable<string> = []
): { attachment: ShallowAttachment; data: Uint8Array<ArrayBuffer> } {
    // Decode base64 to Uint8Array
    const imageData = Uint8Array.fromBase64(base64Data);

    const desiredFilename = `${generatedImageBaseName(new Date())}.png`;
    const filename = resolveFilenameCollision(desiredFilename, existingFilenames);

    // Create attachment with role='assistant'
    const attachment: ShallowAttachment = {
        id: imageId,
        spaceId,
        filename,
        uploadedAt: new Date().toISOString(),
        mimeType: 'image/png',
        rawBytes: imageData.length,
        role: 'assistant',
    };

    return { attachment, data: imageData };
}

export function imageMarkdownFragment(imageId: string): string {
    return `![Generated image](attachment:${imageId})`;
}

export function generateImageMarkdown(imageId: string): string {
    return `\n\n${imageMarkdownFragment(imageId)}\n\n`;
}

const ATTACHMENT_IMAGE_MARKDOWN = /!\[[^\]]*\]\(attachment:[^)]+\)/g;

/**
 * Removes image attachment placeholders from content shared via feedback.
 * The referenced binary/image data is never included in feedback payloads.
 */
export function stripAttachmentMarkdown(content: string): string {
    return content
        .replace(ATTACHMENT_IMAGE_MARKDOWN, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

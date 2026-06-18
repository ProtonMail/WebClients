import type { ShallowAttachment, SpaceId } from '../types';

/**
 * Helper to create an assistant-generated image attachment from base64 data
 */
export function createImageAttachment(
    imageId: string,
    base64Data: string,
    spaceId: SpaceId
): { attachment: ShallowAttachment; data: Uint8Array<ArrayBuffer> } {
    // Decode base64 to Uint8Array
    const imageData = Uint8Array.fromBase64(base64Data);

    // Create attachment with role='assistant'
    const attachment: ShallowAttachment = {
        id: imageId,
        spaceId,
        filename: `${imageId}.png`,
        uploadedAt: new Date().toISOString(),
        mimeType: 'image/png',
        rawBytes: imageData.length,
        role: 'assistant',
    };

    return { attachment, data: imageData };
}

export function lumoImageMarker(id: string, source: 'user' | 'assistant', name?: string): string {
    const nameAttr = name ? ` name="${encodeURIComponent(name)}"` : '';
    return `<lumo-image id="${encodeURIComponent(id)}" source="${encodeURIComponent(source)}"${nameAttr} />`;
}

export function imageMarkdownFragment(imageId: string): string {
    return `![Generated image](attachment:${imageId})`;
}

export function generateImageMarkdown(imageId: string): string {
    return `\n\n${imageMarkdownFragment(imageId)}\n\n`;
}

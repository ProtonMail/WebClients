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

/**
 * Generate markdown reference for inline image
 */
export function generateImageMarkdown(imageId: string): string {
    return `\n\n![Generated image](attachment:${imageId})\n\n`;
}

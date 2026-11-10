import { toolImageMimeType } from '@proton/lumo-api-client/core/client-tools';
import type { ToolFileProcessor, ToolImage } from '@proton/lumo-api-client/core/client-tools';

import { getMimeTypeFromName, getProcessingCategory } from '../../util/filetypes';
import type { FileProcessingService } from '../fileProcessingService';

type Processor = Pick<FileProcessingService, 'processFile'>;

/** Reuse upload conversions; the caller owns transport completion and paging. */
export function createToolFileProcessor(
    enableImageTools: boolean,
    loadService: () => Promise<Processor> = async () => {
        const { FileProcessingService } = await import('../fileProcessingService');
        return FileProcessingService.getInstance({ enableImageTools });
    }
): ToolFileProcessor {
    return async (source) => {
        let mimeType =
            source.mimeType === 'application/octet-stream' ? getMimeTypeFromName(source.name) : source.mimeType;
        // Preserve whole reads of extensionless/custom text files. Unknown binary
        // formats and the attachment pipeline's blocked formats remain unsupported.
        if (mimeType === 'application/octet-stream' && !source.binary) mimeType = 'text/plain';
        if (getProcessingCategory(mimeType, source.name) === 'unsupported') {
            return { content: JSON.stringify({ error: `Unsupported file type: ${source.name}` }), is_error: true };
        }
        const service = await loadService();
        const file = new File([source.data.buffer], source.name, { type: mimeType });
        const result = await service.processFile(file, {
            fileData: source.data.buffer,
            includePdfPageImages: mimeType === 'application/pdf',
        });
        if (result.type === 'error') {
            return {
                content: JSON.stringify({ error: result.message, unsupported: result.unsupported }),
                is_error: true,
            };
        }
        if (result.type === 'text') {
            const images: ToolImage[] = (result.pageImages ?? []).flatMap(({ page, data }) => {
                const base64 = data.toBase64();
                const imageMime = toolImageMimeType(base64);
                return imageMime
                    ? [{ image_id: `${source.id}-p${page}`, path: `${source.path}#page=${page}`, mime_type: imageMime, data: base64 }]
                    : [];
            });
            if (mimeType === 'application/pdf' && !result.content.trim() && images.length === 0) {
                return {
                    content: JSON.stringify({
                        error: 'File contains no extractable text. Scanned PDFs may require OCR.',
                    }),
                    is_error: true,
                };
            }
            return {
                content: JSON.stringify({
                    path: source.path,
                    mime_type: mimeType,
                    content: { encoding: 'utf-8', content: result.content },
                    metadata: result.metadata,
                    ...(images.length > 0 && { page_images: images.map((image) => image.path) }),
                }),
                ...(images.length > 0 && { images }),
            };
        }
        if (result.type === 'image') {
            const data = result.hdImage.toBase64();
            const processedMime = toolImageMimeType(data);
            if (!processedMime) throw new Error('Image conversion produced an unsupported image format.');
            const image: ToolImage = {
                image_id: source.id,
                path: source.path,
                mime_type: processedMime,
                data,
            };
            return { content: `Image read from ${source.path}`, images: [image] };
        }
        throw new Error('Unexpected file processing response.');
    };
}

import type { ThumbnailType } from '@protontech/drive-sdk';

import { type SupportedMimeTypes, THUMBNAIL_MAX_SIDE } from '@proton/shared/lib/drive/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { isSVG } from '@proton/shared/lib/helpers/mimetype';

import { FileLoadError, ThumbnailError } from '../thumbnailError';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';
import { getImageFromFile } from './utils/getImageFromFile';

export class SVGHandler extends BaseHandler {
    readonly handlerName = 'SVGHandler';

    canHandle(mimeType: string): boolean {
        return isSVG(mimeType);
    }

    async generate(
        content: Blob,
        fileName: string,
        fileSize: number,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        originalMimeType: string,
        debug: boolean = false
    ): Promise<ThumbnailGenerationResult> {
        const perf = this.createPerformanceTracker(debug);

        try {
            let blobToScale = content;

            if (isFirefox()) {
                perf.start('svgSizeAdjustment');
                blobToScale = await this.setSvgSize(content, THUMBNAIL_MAX_SIDE);
                perf.end('svgSizeAdjustment');
            }

            perf.start('svgDecoding');
            const img = await getImageFromFile(blobToScale);
            perf.end('svgDecoding');

            const thumbnails = await this.generateThumbnailsFromImage({
                fileSize,
                img,
                mimeType,
                thumbnailTypes,
                originalMimeType,
                perf,
            });

            return {
                thumbnails,
                performance: perf.getResults(),
            };
        } catch (error) {
            if (error instanceof ThumbnailError) {
                throw error;
            }
            throw new FileLoadError('Failed to process SVG file', {
                context: {
                    stage: 'SVG processing',
                },
                cause: error instanceof Error ? error : undefined,
            });
        }
    }

    // Adjusts SVG dimensions using regex-based string manipulation.
    private async setSvgSize(blob: Blob, size: number): Promise<Blob> {
        const text = await blob.text();

        const svgTagMatch = text.match(/<svg([^>]*)>/i);
        if (!svgTagMatch) {
            throw new FileLoadError('No SVG opening tag found', {
                context: {
                    stage: 'SVG tag extraction',
                },
            });
        }

        let svgAttributes = svgTagMatch[1];
        const sizeValue = `${size}px`;

        if (/(^|\s)width\s*=/i.test(svgAttributes)) {
            svgAttributes = svgAttributes.replace(/(^|\s)width\s*=\s*["'][^"']*["']/gi, `$1width="${sizeValue}"`);
        } else {
            svgAttributes += ` width="${sizeValue}"`;
        }

        if (/(^|\s)height\s*=/i.test(svgAttributes)) {
            svgAttributes = svgAttributes.replace(/(^|\s)height\s*=\s*["'][^"']*["']/gi, `$1height="${sizeValue}"`);
        } else {
            svgAttributes += ` height="${sizeValue}"`;
        }

        const modifiedSvg = text.replace(/<svg[^>]*>/i, `<svg${svgAttributes}>`);

        return new Blob([modifiedSvg], { type: 'image/svg+xml;charset=utf-8' });
    }
}

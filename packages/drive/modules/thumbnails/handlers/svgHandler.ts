import type { ThumbnailType } from '@protontech/drive-sdk';

import { type SupportedMimeTypes, THUMBNAIL_MAX_SIDE } from '@proton/shared/lib/drive/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
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

            const thumbnails = await this.generateThumbnailsFromImage(fileSize, img, {
                mimeType,
                thumbnailTypes,
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

    private parseSvg(svgString: string) {
        return parseStringToDOM(svgString, 'image/svg+xml');
    }

    private async setSvgSize(blob: Blob, size: number): Promise<Blob> {
        const text = await blob.text();

        const doc = this.parseSvg(text);
        const svgElement = doc.querySelector('svg');

        const svgWidth = svgElement?.getAttribute('width') || `${size}px`;
        const svgHeight = svgElement?.getAttribute('height') || `${size}px`;

        svgElement?.setAttribute('width', svgWidth);
        svgElement?.setAttribute('height', svgHeight);

        const svgString = svgElement?.outerHTML || '';

        return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    }
}

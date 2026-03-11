# Creating a New Thumbnail Handler

This guide explains how to add support for a new file type to the thumbnail generation system.

## Quick Start

1. **Create your handler file** (e.g., `pdfHandler.ts`)
2. **Implement the `GenericHandler` interface**
3. **Register it in `handlerRegistry.ts`**

## Step-by-Step Guide

### 1. Create Your Handler Class

Create a new file in `handlers/` that extends `BaseHandler`:

```typescript
import type { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { FileLoadError } from '../errors';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';

export class PdfHandler extends BaseHandler {
    /**
     * This is used for debug/report as constructor.name is changed when transpile
     */
    readonly handlerName = 'PdfHandler';
    /**
     * Determines if this handler can process the given file.
     *
     * @param mimeType - Detected MIME type from the file
     * @param fileName - Original file name (useful for extension checks)
     * @returns true if this handler can process the file
     */
    canHandle(mimeType: string, fileName: string): boolean {
        return mimeType === 'application/pdf' || fileName.endsWith('.pdf');
    }

    /**
     * Generates thumbnails for the file.
     *
     * @param file - The file to process
     * @param mimeType - Output format (JPEG or WebP)
     * @param thumbnailTypes - Which thumbnail sizes to generate
     * @param debug - Enable performance tracking
     */
    async generate(
        file: File,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        debug: boolean = false
    ): Promise<ThumbnailGenerationResult> {
        const perf = this.createPerformanceTracker(debug);

        try {
            // 1. Decode/load your format
            perf.start('pdfDecoding');
            const firstPage = await this.extractFirstPage(file);
            perf.end('pdfDecoding');

            // 2. Convert to HTMLImageElement
            perf.start('imageConversion');
            const img = await this.convertToImage(firstPage);
            perf.end('imageConversion');

            // 3. Generate thumbnails using BaseHandler utility
            const thumbnails = await this.generateThumbnailsFromImage(file, img, { mimeType, thumbnailTypes, perf });

            return {
                thumbnails,
                performance: perf.getResults(),
            };
        } catch (error) {
            throw new FileLoadError('Failed to process PDF', {
                context: { stage: 'pdf processing' },
                cause: error instanceof Error ? error : undefined,
            });
        }
    }

    private async extractFirstPage(file: File): Promise<ImageData> {
        // Your format-specific logic here
    }

    private async convertToImage(data: ImageData): Promise<HTMLImageElement> {
        // Convert your data to an HTMLImageElement
    }
}
```

### 2. Register Your Handler

Add your handler to `handlerRegistry.ts` in the `registerDefaultHandlers()` method:

```typescript
private registerDefaultHandlers(): void {
    this.handlers.push(
        new ImageHandler()
        new VideoHandler(),
        new SVGHandler(),
        new HeicHandler(),
        new RawImageHandler(),
        new CbzHandler(),
        new PdfHandler(),        // ← Add your handler here
    );
}
```

### Error Classes

```typescript
import {
    // File loading/parsing failed
    CanvasError,
    // Canvas operation failed
    ConversionError,
    // Thumbnail encoding failed
    CorruptedImageError,
    // File is corrupted/invalid
    // Format conversion failed
    EncodingError,
    FileLoadError,
} from '../errors';
```

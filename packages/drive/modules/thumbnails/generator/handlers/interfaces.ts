import type { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import type { ThumbnailResult } from '../utils';

export interface HandlerOptions {
    timeout?: number;
    maxFileSize?: number;
}

export interface ThumbnailGenerationResult {
    thumbnails: ThumbnailResult;
    performance?: Record<string, string>;
}

export interface GenericHandler {
    readonly handlerName: string;

    canHandle(mimeType: string, name: string): boolean;

    generate(
        content: Blob,
        fileName: string,
        fileSize: number,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        originalMimeType: string,
        debug?: boolean,
        options?: HandlerOptions
    ): Promise<ThumbnailGenerationResult>;
}

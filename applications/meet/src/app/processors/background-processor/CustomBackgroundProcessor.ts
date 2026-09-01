import type { BackgroundOptions, SegmenterOptions } from '@livekit/track-processors';

import { withTimeout } from '@proton/meet/utils/withTimeout';

import {
    BACKGROUND_IMAGE_DECODE_TIMEOUT_MS,
    MAX_BACKGROUND_IMAGE_EDGE,
    MAX_BACKGROUND_IMAGE_PIXELS,
} from '../../utils/customBackgrounds/constants';
import BaseBackgroundProcessor from './BaseBackgroundProcessor';
import { createProcessorWrapper } from './createProcessorWrapper';
import type {
    CustomBackgroundProcessor as CustomBackgroundProcessorHandle,
    CustomBackgroundProcessorOptions,
} from './types';

// Edge (px) of the offscreen canvas used to synthesise a solid-color background.
// It only needs to be a valid non-empty bitmap; LiveKit resizes it to cover the
// output frame, so a small square is enough.
const SOLID_COLOR_BITMAP_EDGE = 64;

/**
 * Custom background: composites the segmented person over a user-provided
 * background — either a solid color or an uploaded/remote image. The whole
 * segmentation + mask pipeline is shared with the blur processor via
 * {@link BaseBackgroundProcessor}; this class only produces the background
 * bitmap and hands it to LiveKit's compositor.
 */
export default class CustomBackgroundProcessor extends BaseBackgroundProcessor<CustomBackgroundProcessorOptions> {
    // Currently applied source bitmap; retained to release on change and reuse when unchanged.
    private sourceBitmap: ImageBitmap | null = null;

    private appliedKey: string | null = null;

    // Bumped per configureBackground() call so a stale build can detect it was superseded.
    private configureGeneration = 0;

    private backgroundKey(): string {
        if (this.options.imageUrl) {
            return `image:${this.options.imageUrl}`;
        }
        if (this.options.backgroundColor) {
            return `color:${this.options.backgroundColor}`;
        }
        return '';
    }

    private async loadBackgroundImage(imageUrl: string): Promise<ImageBitmap> {
        const image = new Image();
        image.crossOrigin = 'anonymous';

        try {
            await withTimeout(
                new Promise<void>((resolve, reject) => {
                    image.onload = () => resolve();
                    image.onerror = () => reject(new Error('Failed to load background image'));
                    image.src = imageUrl;
                }),
                'Loading the background image',
                BACKGROUND_IMAGE_DECODE_TIMEOUT_MS
            );
        } finally {
            image.onload = null;
            image.onerror = null;
        }

        const { naturalWidth: width, naturalHeight: height } = image;

        if (!width || !height) {
            throw new Error('The background image decoded to no pixels');
        }

        if (
            width > MAX_BACKGROUND_IMAGE_EDGE ||
            height > MAX_BACKGROUND_IMAGE_EDGE ||
            width * height > MAX_BACKGROUND_IMAGE_PIXELS
        ) {
            throw new Error(`The background image is too large to composite: ${width}x${height}`);
        }

        return createImageBitmap(image);
    }

    private async buildBackgroundBitmap(): Promise<ImageBitmap | null> {
        const { imageUrl, backgroundColor } = this.options;

        if (imageUrl) {
            return this.loadBackgroundImage(imageUrl);
        }

        if (backgroundColor) {
            const canvas = new OffscreenCanvas(SOLID_COLOR_BITMAP_EDGE, SOLID_COLOR_BITMAP_EDGE);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return null;
            }
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, SOLID_COLOR_BITMAP_EDGE, SOLID_COLOR_BITMAP_EDGE);
            return createImageBitmap(canvas);
        }

        return null;
    }

    protected async configureBackground() {
        if (!this.gl) {
            return;
        }

        const generation = ++this.configureGeneration;
        const key = this.backgroundKey();
        if (key === this.appliedKey) {
            // Re-apply the cached bitmap so a re-init (e.g. camera switch) restores
            // the background without decoding it again.
            await this.gl.setBackgroundImage(this.sourceBitmap);
            return;
        }

        let bitmap: ImageBitmap | null = null;
        try {
            bitmap = await this.buildBackgroundBitmap();
        } catch {
            bitmap = null;
        }

        // Bail if a newer call superseded this one or the pipeline was torn down,
        // so the most recently requested background always wins.
        if (generation !== this.configureGeneration || !this.gl) {
            bitmap?.close();
            return;
        }

        this.sourceBitmap?.close();
        this.sourceBitmap = bitmap;
        this.appliedKey = key;

        await this.gl.setBackgroundImage(bitmap);
    }

    // Swap the background (color or image) without rebuilding the segmentation
    // pipeline. Passing an empty object clears the background.
    async setBackground(background: { backgroundColor?: string; imageUrl?: string }) {
        this.options = {
            ...this.options,
            backgroundColor: background.backgroundColor,
            imageUrl: background.imageUrl,
        };
        await this.configureBackground();
    }

    async destroy() {
        await super.destroy();
        this.sourceBitmap?.close();
        this.sourceBitmap = null;
        this.appliedKey = null;
    }
}

export const CustomBackground = (
    background?: { backgroundColor?: string; imageUrl?: string },
    segmenterOptions?: SegmenterOptions,
    processorOptions?: CustomBackgroundProcessorOptions
) => {
    const options: CustomBackgroundProcessorOptions = {
        ...background,
        segmenterOptions,
        ...processorOptions,
    };
    const transformer = new CustomBackgroundProcessor(options);
    const processor = createProcessorWrapper<BackgroundOptions>(
        transformer,
        'custom-background',
        processorOptions
    ) as CustomBackgroundProcessorHandle;

    processor.enable = () => transformer.enable();
    processor.disable = () => transformer.disable();
    processor.isEnabled = () => transformer.isEnabled();
    processor.getActiveDelegate = () => transformer.activeDelegate;
    processor.waitUntilBackgroundApplied = () => transformer.waitUntilApplied();
    processor.setBackground = (next) => transformer.setBackground(next);

    return processor;
};

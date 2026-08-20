import type { BackgroundOptions, SegmenterOptions } from '@livekit/track-processors';

import BaseBackgroundProcessor from './BaseBackgroundProcessor';
import { createProcessorWrapper } from './createProcessorWrapper';
import type { BackgroundBlurProcessor, BackgroundProcessorOptions } from './types';

// Re-exported for backward compatibility: asset preloading is shared across
// every background processor and now lives on the base module.
export { preloadBackgroundBlurAssets } from './BaseBackgroundProcessor';

/**
 * Background blur: composites the segmented person over a blurred copy of the
 * camera frame. All the heavy lifting (segmentation, mask shaping) lives in
 * {@link BaseBackgroundProcessor}; this class only tells LiveKit's compositor to
 * use a blurred background of the configured radius.
 */
export default class MulticlassBackgroundProcessor extends BaseBackgroundProcessor<BackgroundProcessorOptions> {
    constructor(opts: BackgroundProcessorOptions) {
        super(opts);

        const overrides = opts.constantOverrides;
        if (typeof overrides?.blurRadius === 'number' && Number.isFinite(overrides.blurRadius)) {
            this.options.blurRadius = Math.max(0, Math.round(overrides.blurRadius));
        }
    }

    // Check against undefined (not truthiness) so the tuner can set blur to 0.
    protected configureBackground() {
        if (typeof this.options.blurRadius === 'number') {
            this.gl?.setBlurRadius(this.options.blurRadius);
        }
    }
}

export const BackgroundBlur = (
    blurRadius?: number,
    segmenterOptions?: SegmenterOptions,
    processorOptions?: BackgroundProcessorOptions
) => {
    const options: BackgroundProcessorOptions = {
        blurRadius,
        segmenterOptions,
        ...processorOptions,
    };
    const transformer = new MulticlassBackgroundProcessor(options);
    const processor = createProcessorWrapper<BackgroundOptions>(
        transformer,
        'background-blur',
        processorOptions
    ) as BackgroundBlurProcessor;

    processor.enable = () => transformer.enable();
    processor.disable = () => transformer.disable();
    processor.isEnabled = () => transformer.isEnabled();
    processor.getActiveDelegate = () => transformer.activeDelegate;
    processor.waitUntilBlurApplied = () => transformer.waitUntilApplied();

    return processor;
};

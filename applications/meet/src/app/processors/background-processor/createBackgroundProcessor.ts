import { supportsBackgroundProcessors, supportsModernBackgroundProcessors } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { isLowEndDevice } from '../../utils/isLowEndDevice';
import { MAX_FPS_MOBILE } from './constants';
import { getConfidenceBoostConfig } from './getConfidenceBoostConfig';
import type { TunableConstantsOverrides } from './tunableConstants';
import type { BackgroundMode, BackgroundProcessor, BackgroundProcessorOptions } from './types';

const SIMPLE_SEGMENTATION_MODEL_PATH = '/assets/background-blur/selfie_segmenter.tflite';
const MULTICLASS_SEGMENTATION_MODEL_PATH = '/assets/background-blur/selfie_multiclass_256x256.tflite';

let isSupported: boolean | undefined;

// Creating the WebGL2 context is slightly expensive, and neither the GL capability
// nor the user agent can change for the lifetime of the page, so probe at most once.
export const supportsBackgroundEffects = () => (isSupported ??= supportsBackgroundProcessors());

const getAssetPaths = (useSimpleSegmentation: boolean) => ({
    tasksVisionFileSet: '/assets/background-blur',
    modelAssetPath: useSimpleSegmentation ? SIMPLE_SEGMENTATION_MODEL_PATH : MULTICLASS_SEGMENTATION_MODEL_PATH,
});

// Phones always take the simple model. transform() awaits each mask inline before
// compositing, so a model whose inference exceeds the mobile frame budget drags the
// output rate down to the inference rate rather than merely looking coarser.
const needsSimpleSegmentation = (mobileDevice: boolean, lowEndDevice: boolean) => mobileDevice || lowEndDevice;

// Paces the requestAnimationFrame fallback only; the stream-processor path is capped
// by the processor itself.
const getMaxFps = (mobileDevice: boolean) => {
    if (mobileDevice) {
        return MAX_FPS_MOBILE;
    }
    return supportsModernBackgroundProcessors() ? 30 : 20;
};

// One processor serves every background effect: callers switch between blur and
// an image with `setMode()` rather than building a second one.
export const createBackgroundProcessor = async (
    mode: BackgroundMode = { type: 'blur' },
    forceSimpleSegmentation = false,
    constantOverrides?: TunableConstantsOverrides
): Promise<BackgroundProcessor | null> => {
    if (!supportsBackgroundEffects()) {
        return null;
    }

    try {
        const { createBackgroundProcessorHandle } = await import(
            /* webpackChunkName: "background-processor" */
            './BackgroundProcessor'
        );
        const lowEndDevice = isLowEndDevice();
        const mobileDevice = isMobile();

        const options: BackgroundProcessorOptions = {
            mode,
            assetPaths: getAssetPaths(needsSimpleSegmentation(mobileDevice, lowEndDevice) || forceSimpleSegmentation),
            maxFps: getMaxFps(mobileDevice),
            ...getConfidenceBoostConfig(),
            isLowEndDevice: lowEndDevice,
            isMobile: mobileDevice,
            constantOverrides,
        };

        return createBackgroundProcessorHandle(options);
    } catch {
        return null;
    }
};

export const preloadBackgroundProcessorAssets = async () => {
    if (!supportsBackgroundEffects()) {
        return;
    }

    try {
        const { preloadBackgroundBlurAssets } = await import('./BackgroundProcessor');
        await preloadBackgroundBlurAssets(getAssetPaths(needsSimpleSegmentation(isMobile(), isLowEndDevice())));
    } catch (error) {
        // Preload failed, but don't block - will retry when user enables blur
    }
};

export const ensureBackgroundProcessor = async (
    videoTrack: LocalVideoTrack | null | undefined,
    processor?: BackgroundProcessor | null
): Promise<BackgroundProcessor | null> => {
    if (!videoTrack || !processor) {
        return null;
    }

    if (videoTrack.getProcessor() === processor) {
        return processor;
    }

    try {
        await videoTrack.setProcessor(processor);
    } catch {
        return null;
    }

    return processor;
};

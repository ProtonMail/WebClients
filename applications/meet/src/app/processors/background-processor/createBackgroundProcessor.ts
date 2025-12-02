import {
    type BackgroundProcessorOptions,
    supportsBackgroundProcessors,
    supportsModernBackgroundProcessors,
} from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { isLowEndDevice } from '../../utils/isLowEndDevice';
import {
    BackgroundBlur,
    type BackgroundBlurProcessor,
    preloadBackgroundBlurAssets,
} from './MulticlassBackgroundProcessor';

const backgroundProcessorOptions: BackgroundProcessorOptions = {
    assetPaths: {
        tasksVisionFileSet: '/assets/background-blur',
        modelAssetPath: isLowEndDevice()
            ? '/assets/background-blur/selfie_segmenter.tflite'
            : '/assets/background-blur/selfie_multiclass_256x256.tflite',
    },
};

export const createBackgroundProcessor = (): BackgroundBlurProcessor | null => {
    if (!supportsBackgroundProcessors() || isMobile()) {
        return null;
    }

    try {
        const modernProcessorsSupported = supportsModernBackgroundProcessors();
        const dynamicProcessorOptions = { maxFps: modernProcessorsSupported ? 30 : 20 };
        return BackgroundBlur(60, undefined, { ...backgroundProcessorOptions, ...dynamicProcessorOptions });
    } catch {
        return null;
    }
};

export const preloadBackgroundProcessorAssets = async () => {
    if (!supportsBackgroundProcessors() || isMobile()) {
        return;
    }

    try {
        await preloadBackgroundBlurAssets(backgroundProcessorOptions.assetPaths);
    } catch (error) {
        // Preload failed, but don't block - will retry when user enables blur
    }
};

export const ensureBackgroundBlurProcessor = async (
    videoTrack: LocalVideoTrack | null | undefined,
    processor?: BackgroundBlurProcessor | null
) => {
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

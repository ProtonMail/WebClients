import { supportsBackgroundProcessors, supportsModernBackgroundProcessors } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { isLowEndDevice } from '../../utils/isLowEndDevice';
import {
    BackgroundBlur,
    type BackgroundBlurProcessor,
    type BackgroundProcessorOptions,
    preloadBackgroundBlurAssets,
} from './MulticlassBackgroundProcessor';

const SIMPLE_SEGMENTATION_MODEL_PATH = '/assets/background-blur/selfie_segmenter.tflite';
const MULTICLASS_SEGMENTATION_MODEL_PATH = '/assets/background-blur/selfie_multiclass_256x256.tflite';

const getBackgroundProcessorOptions = (useSimpleSegmentation: boolean): BackgroundProcessorOptions => ({
    assetPaths: {
        tasksVisionFileSet: '/assets/background-blur',
        modelAssetPath: useSimpleSegmentation ? SIMPLE_SEGMENTATION_MODEL_PATH : MULTICLASS_SEGMENTATION_MODEL_PATH,
    },
});

export const createBackgroundProcessor = (isUseSimpleSegmentationEnabled: boolean): BackgroundBlurProcessor | null => {
    if (!supportsBackgroundProcessors() || isMobile()) {
        return null;
    }

    try {
        const lowEndDevice = isLowEndDevice();
        const useSimpleSegmentation = lowEndDevice || isUseSimpleSegmentationEnabled;

        const backgroundProcessorOptions = getBackgroundProcessorOptions(useSimpleSegmentation);
        const modernProcessorsSupported = supportsModernBackgroundProcessors();
        const dynamicProcessorOptions = { maxFps: modernProcessorsSupported ? 30 : 20 };
        return BackgroundBlur(60, undefined, {
            ...backgroundProcessorOptions,
            ...dynamicProcessorOptions,
            isLowEndDevice: lowEndDevice,
        });
    } catch {
        return null;
    }
};

export const preloadBackgroundProcessorAssets = async (isUseSimpleSegmentationEnabled: boolean) => {
    if (!supportsBackgroundProcessors() || isMobile()) {
        return;
    }

    try {
        const useSimpleSegmentation = isLowEndDevice() || isUseSimpleSegmentationEnabled;
        const backgroundProcessorOptions = getBackgroundProcessorOptions(useSimpleSegmentation);
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

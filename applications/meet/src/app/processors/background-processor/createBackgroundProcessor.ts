import { supportsBackgroundProcessors, supportsModernBackgroundProcessors } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { isLowEndDevice } from '../../utils/isLowEndDevice';
import type { CustomBackground as CustomBackgroundImpl } from './CustomBackgroundProcessor';
import type {
    BackgroundBlur as BackgroundBlurImpl,
    preloadBackgroundBlurAssets as preloadBackgroundBlurAssetsImpl,
} from './MulticlassBackgroundProcessor';
import { getConfidenceBoostConfig } from './getConfidenceBoostConfig';
import type { TunableConstantsOverrides } from './tunableConstants';
import type {
    BackgroundBlurProcessor,
    BackgroundProcessorOptions,
    BackgroundProcessorVersion,
    CustomBackgroundProcessor,
    CustomBackgroundProcessorOptions,
} from './types';

const SIMPLE_SEGMENTATION_MODEL_PATH = '/assets/background-blur/selfie_segmenter.tflite';
const MULTICLASS_SEGMENTATION_MODEL_PATH = '/assets/background-blur/selfie_multiclass_256x256.tflite';

const DEFAULT_BACKGROUND_PROCESSOR_VERSION: BackgroundProcessorVersion = 'next';

type BackgroundProcessorModule = {
    BackgroundBlur: typeof BackgroundBlurImpl;
    preloadBackgroundBlurAssets: typeof preloadBackgroundBlurAssetsImpl;
};

const loadBackgroundProcessorImplementation = async (
    version: BackgroundProcessorVersion
): Promise<BackgroundProcessorModule> => {
    if (version === 'current') {
        try {
            return await import('./current/MulticlassBackgroundProcessor');
        } catch {
            return import('./MulticlassBackgroundProcessor');
        }
    }

    return import('./MulticlassBackgroundProcessor');
};

let isSupported: boolean | undefined;

// Creating the WebGL2 context is slightly expensive, and neither the GL capability
// nor the user agent can change for the lifetime of the page, so probe at most once.
export const supportsBackgroundEffects = () => (isSupported ??= !isMobile() && supportsBackgroundProcessors());

const getBackgroundProcessorOptions = (useSimpleSegmentation: boolean): BackgroundProcessorOptions => ({
    assetPaths: {
        tasksVisionFileSet: '/assets/background-blur',
        modelAssetPath: useSimpleSegmentation ? SIMPLE_SEGMENTATION_MODEL_PATH : MULTICLASS_SEGMENTATION_MODEL_PATH,
    },
});

export const createBackgroundProcessor = async (
    forceSimpleSegmentation = false,
    version: BackgroundProcessorVersion = DEFAULT_BACKGROUND_PROCESSOR_VERSION,
    constantOverrides?: TunableConstantsOverrides
): Promise<BackgroundBlurProcessor | null> => {
    if (!supportsBackgroundEffects()) {
        return null;
    }

    try {
        const { BackgroundBlur } = await loadBackgroundProcessorImplementation(version);
        const lowEndDevice = isLowEndDevice();
        const useSimpleSegmentation = lowEndDevice || forceSimpleSegmentation;

        const backgroundProcessorOptions = getBackgroundProcessorOptions(useSimpleSegmentation);
        const modernProcessorsSupported = supportsModernBackgroundProcessors();
        const dynamicProcessorOptions = { maxFps: modernProcessorsSupported ? 30 : 20 };
        const blurRadius = typeof constantOverrides?.blurRadius === 'number' ? constantOverrides.blurRadius : 60;
        return BackgroundBlur(blurRadius, undefined, {
            ...backgroundProcessorOptions,
            ...dynamicProcessorOptions,
            ...getConfidenceBoostConfig(),
            isLowEndDevice: lowEndDevice,
            constantOverrides,
        });
    } catch {
        return null;
    }
};

export const createCustomBackgroundProcessor = async (
    background: { backgroundColor?: string; imageUrl?: string },
    forceSimpleSegmentation = false,
    constantOverrides?: TunableConstantsOverrides
): Promise<CustomBackgroundProcessor | null> => {
    if (!supportsBackgroundEffects()) {
        return null;
    }

    try {
        const { CustomBackground }: { CustomBackground: typeof CustomBackgroundImpl } = await import(
            /* webpackChunkName: "custom-background-processor" */
            './CustomBackgroundProcessor'
        );
        const lowEndDevice = isLowEndDevice();
        const useSimpleSegmentation = lowEndDevice || forceSimpleSegmentation;

        const backgroundProcessorOptions = getBackgroundProcessorOptions(useSimpleSegmentation);
        const modernProcessorsSupported = supportsModernBackgroundProcessors();
        const dynamicProcessorOptions = { maxFps: modernProcessorsSupported ? 30 : 20 };
        const processorOptions: CustomBackgroundProcessorOptions = {
            ...backgroundProcessorOptions,
            ...dynamicProcessorOptions,
            ...getConfidenceBoostConfig(),
            isLowEndDevice: lowEndDevice,
            constantOverrides,
        };
        return CustomBackground(background, undefined, processorOptions);
    } catch {
        return null;
    }
};

export const preloadBackgroundProcessorAssets = async (
    version: BackgroundProcessorVersion = DEFAULT_BACKGROUND_PROCESSOR_VERSION
) => {
    if (!supportsBackgroundEffects()) {
        return;
    }

    try {
        const { preloadBackgroundBlurAssets } = await loadBackgroundProcessorImplementation(version);
        const useSimpleSegmentation = isLowEndDevice();
        const backgroundProcessorOptions = getBackgroundProcessorOptions(useSimpleSegmentation);
        await preloadBackgroundBlurAssets(backgroundProcessorOptions.assetPaths);
    } catch (error) {
        // Preload failed, but don't block - will retry when user enables blur
    }
};

export const ensureBackgroundProcessor = async <T extends BackgroundBlurProcessor | CustomBackgroundProcessor>(
    videoTrack: LocalVideoTrack | null | undefined,
    processor?: T | null
): Promise<T | null> => {
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

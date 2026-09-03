import type {
    BackgroundOptions,
    ProcessorWrapper,
    ProcessorWrapperOptions,
    SegmenterOptions,
} from '@livekit/track-processors';

import type { TunableConstantsOverrides } from './tunableConstants';

// Options shared by every background processor; background-specific options extend this.
export interface BaseBackgroundProcessorOptions extends ProcessorWrapperOptions {
    segmenterOptions?: SegmenterOptions;
    assetPaths?: {
        tasksVisionFileSet?: string;
        modelAssetPath?: string;
    };
    isLowEndDevice?: boolean;
    isMobile?: boolean;
    personConfidenceBoost?: number;
    multiclassPersonConfidenceBoost?: number;
    constantOverrides?: TunableConstantsOverrides;
}

export interface BackgroundProcessorOptions extends BaseBackgroundProcessorOptions {
    blurRadius?: number;
}

export interface CustomBackgroundProcessorOptions extends BaseBackgroundProcessorOptions {
    // Solid CSS color used to fill the background (mutually exclusive with `imageUrl`).
    backgroundColor?: string;
    // Image source (object URL, data URL or remote URL) drawn as the background.
    imageUrl?: string;
}

type SharedBackgroundProcessorHandle = ProcessorWrapper<BackgroundOptions> & {
    enable: () => void;
    disable: () => void;
    isEnabled: () => boolean;
    getActiveDelegate: () => 'GPU' | 'CPU' | undefined;
};

export type BackgroundBlurProcessor = SharedBackgroundProcessorHandle & {
    waitUntilBlurApplied?: () => Promise<void>;
};

export type CustomBackgroundProcessor = SharedBackgroundProcessorHandle & {
    waitUntilBackgroundApplied?: () => Promise<void>;
    // Update the background (color or image) without rebuilding the pipeline.
    setBackground?: (background: { backgroundColor?: string; imageUrl?: string }) => Promise<void>;
};

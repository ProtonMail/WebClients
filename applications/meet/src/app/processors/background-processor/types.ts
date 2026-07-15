import type {
    BackgroundOptions,
    ProcessorWrapper,
    ProcessorWrapperOptions,
    SegmenterOptions,
} from '@livekit/track-processors';

import type { TunableConstantsOverrides } from './tunableConstants';

// Selects which background processor implementation is used. `current` is the
// version shipping today; `next` carries the segmentation/blur adjustments.
export type BackgroundProcessorVersion = 'current' | 'next';

export interface BackgroundProcessorOptions extends ProcessorWrapperOptions {
    blurRadius?: number;
    segmenterOptions?: SegmenterOptions;
    assetPaths?: {
        tasksVisionFileSet?: string;
        modelAssetPath?: string;
    };
    isLowEndDevice?: boolean;
    personConfidenceBoost?: number;
    multiclassPersonConfidenceBoost?: number;
    constantOverrides?: TunableConstantsOverrides;
}

export type BackgroundBlurProcessor = ProcessorWrapper<BackgroundOptions> & {
    enable: () => void;
    disable: () => void;
    isEnabled: () => boolean;
    getActiveDelegate: () => 'GPU' | 'CPU' | undefined;
    waitUntilBlurApplied?: () => Promise<void>;
};

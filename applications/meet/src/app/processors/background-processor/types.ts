import type {
    BackgroundOptions,
    ProcessorWrapper,
    ProcessorWrapperOptions,
    SegmenterOptions,
} from '@livekit/track-processors';

import type { TunableConstantsOverrides } from './tunableConstants';

// What the segmented person is composited over. Both variants run on the same
// pipeline, so switching between them only changes compositor state.
export type BackgroundMode =
    | { type: 'blur'; blurRadius?: number }
    // An object URL, data URL or remote URL.
    | { type: 'image'; imageUrl: string };

export interface BackgroundProcessorOptions extends ProcessorWrapperOptions {
    mode?: BackgroundMode;
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

export type BackgroundProcessor = ProcessorWrapper<BackgroundOptions> & {
    enable: () => void;
    disable: () => void;
    isEnabled: () => boolean;
    getActiveDelegate: () => 'GPU' | 'CPU' | undefined;
    waitUntilApplied: () => Promise<void>;
    // Whether the effect is live rather than still warming up.
    hasAppliedMask: () => boolean;
    // Swap the background without rebuilding the segmentation pipeline.
    setMode: (mode: BackgroundMode) => Promise<void>;
};

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { isLowEndDevice } from '../../utils/isLowEndDevice';
import {
    MASK_CLOSING_RADIUS,
    MASK_CLOSING_RADIUS_LOW_END,
    MASK_CLOSING_RADIUS_MOBILE,
    MASK_TEMPORAL_APPEAR_RATE,
    MASK_TEMPORAL_APPEAR_RATE_FAST,
    MASK_TEMPORAL_DISAPPEAR_RATE,
    MASK_TEMPORAL_DISAPPEAR_RATE_FAST,
    MASK_TEMPORAL_MOTION_HIGH,
    MASK_TEMPORAL_MOTION_LOW,
    SEGMENTATION_FRAME_INTERVAL,
    SEGMENTATION_INPUT_MAX_EDGE,
    SEGMENTATION_INPUT_MAX_EDGE_HIGH_END,
    SEGMENTATION_INPUT_MAX_EDGE_MOBILE,
} from './constants';
import { getConfidenceBoostConfig } from './getConfidenceBoostConfig';

export const DEFAULT_BLUR_RADIUS = 60;

export interface TunableConstants {
    personConfidenceBoost: number;
    multiclassPersonConfidenceBoost: number;
    maskTemporalAppearRate: number;
    maskTemporalDisappearRate: number;
    maskTemporalAppearRateFast: number;
    maskTemporalDisappearRateFast: number;
    maskTemporalMotionLow: number;
    maskTemporalMotionHigh: number;
    maskClosingRadius: number;
    segmentationInputMaxEdge: number;
    segmentationFrameInterval: number;
    blurRadius: number;
}

// Device class a processor was created for; mobile wins wherever both apply.
export interface DeviceTier {
    isMobile?: boolean;
    isLowEndDevice?: boolean;
}

export const getDefaultMaskClosingRadius = (tier: DeviceTier): number => {
    if (tier.isMobile) {
        return MASK_CLOSING_RADIUS_MOBILE;
    }
    return tier.isLowEndDevice ? MASK_CLOSING_RADIUS_LOW_END : MASK_CLOSING_RADIUS;
};

export const getDefaultSegmentationInputMaxEdge = (tier: DeviceTier): number => {
    if (tier.isMobile) {
        return SEGMENTATION_INPUT_MAX_EDGE_MOBILE;
    }
    return tier.isLowEndDevice ? SEGMENTATION_INPUT_MAX_EDGE : SEGMENTATION_INPUT_MAX_EDGE_HIGH_END;
};

export const getSegmentationResizeQuality = (tier: DeviceTier): ResizeQuality => {
    if (tier.isMobile) {
        return 'low';
    }
    return tier.isLowEndDevice ? 'medium' : 'high';
};

export type TunableConstantsOverrides = Partial<TunableConstants>;

export const WORKER_CONSTANT_KEYS = [
    'personConfidenceBoost',
    'multiclassPersonConfidenceBoost',
    'maskTemporalAppearRate',
    'maskTemporalDisappearRate',
    'maskTemporalAppearRateFast',
    'maskTemporalDisappearRateFast',
    'maskTemporalMotionLow',
    'maskTemporalMotionHigh',
] as const satisfies readonly (keyof TunableConstants)[];

export type WorkerConstantKey = (typeof WORKER_CONSTANT_KEYS)[number];

export const getDefaultTunableConstants = (): TunableConstants => {
    const tier: DeviceTier = { isMobile: isMobile(), isLowEndDevice: isLowEndDevice() };
    const { personConfidenceBoost, multiclassPersonConfidenceBoost } = getConfidenceBoostConfig();

    return {
        personConfidenceBoost,
        multiclassPersonConfidenceBoost,
        maskTemporalAppearRate: MASK_TEMPORAL_APPEAR_RATE,
        maskTemporalDisappearRate: MASK_TEMPORAL_DISAPPEAR_RATE,
        maskTemporalAppearRateFast: MASK_TEMPORAL_APPEAR_RATE_FAST,
        maskTemporalDisappearRateFast: MASK_TEMPORAL_DISAPPEAR_RATE_FAST,
        maskTemporalMotionLow: MASK_TEMPORAL_MOTION_LOW,
        maskTemporalMotionHigh: MASK_TEMPORAL_MOTION_HIGH,
        maskClosingRadius: getDefaultMaskClosingRadius(tier),
        segmentationInputMaxEdge: getDefaultSegmentationInputMaxEdge(tier),
        segmentationFrameInterval: SEGMENTATION_FRAME_INTERVAL,
        blurRadius: DEFAULT_BLUR_RADIUS,
    };
};

export const pickWorkerOverrides = (
    overrides: TunableConstantsOverrides
): Partial<Record<WorkerConstantKey, number>> => {
    const result: Partial<Record<WorkerConstantKey, number>> = {};
    for (const key of WORKER_CONSTANT_KEYS) {
        const value = overrides[key];
        if (typeof value === 'number') {
            result[key] = value;
        }
    }
    return result;
};

export type TunableConstantCategory = 'Confidence' | 'Temporal smoothing' | 'Mask shaping' | 'Segmentation';

export interface TunableConstantField {
    key: keyof TunableConstants;
    label: string;
    min: number;
    max: number;
    step: number;
    category: TunableConstantCategory;
    // Integer-valued controls (radius, taps, edge, blur) are rounded on input.
    integer?: boolean;
    description?: string;
}

export const TUNABLE_CONSTANT_FIELDS: TunableConstantField[] = [
    {
        key: 'personConfidenceBoost',
        label: 'Person confidence boost (simple)',
        min: 0,
        max: 3,
        step: 0.05,
        category: 'Confidence',
        description:
            'Multiplier on the simple selfie model’s person mask (result clamped to 1.0). Higher keeps more marginal pixels as “person”, reducing edge cut-off but risking background bleed.',
    },
    {
        key: 'multiclassPersonConfidenceBoost',
        label: 'Person confidence boost (multiclass)',
        min: 0,
        max: 3,
        step: 0.05,
        category: 'Confidence',
        description:
            'Multiplier on the multiclass model’s person confidence (person = 1 − background). Higher fills under-confident interior regions but can leak background near the silhouette.',
    },
    {
        key: 'maskTemporalAppearRate',
        label: 'Temporal appear rate',
        min: 0,
        max: 1,
        step: 0.01,
        category: 'Temporal smoothing',
        description:
            'How fast the smoothed mask follows rising confidence (a pixel becoming “person”). Higher = more responsive, lower = smoother but laggier.',
    },
    {
        key: 'maskTemporalDisappearRate',
        label: 'Temporal disappear rate',
        min: 0,
        max: 1,
        step: 0.01,
        category: 'Temporal smoothing',
        description:
            'How fast the smoothed mask follows falling confidence (a pixel leaving “person”). Kept low so the edge eases out slowly, which is what kills flicker.',
    },
    {
        key: 'maskTemporalAppearRateFast',
        label: 'Temporal appear rate (fast)',
        min: 0,
        max: 1,
        step: 0.01,
        category: 'Temporal smoothing',
        description:
            'Appear rate used when a pixel changes a lot between frames (real motion). Near 1.0 so fast movement isn’t held back by smoothing.',
    },
    {
        key: 'maskTemporalDisappearRateFast',
        label: 'Temporal disappear rate (fast)',
        min: 0,
        max: 1,
        step: 0.01,
        category: 'Temporal smoothing',
        description:
            'Disappear rate used for large per-pixel changes (real motion), so a moving silhouette doesn’t leave a stale trail.',
    },
    {
        key: 'maskTemporalMotionLow',
        label: 'Motion threshold (low)',
        min: 0,
        max: 1,
        step: 0.01,
        category: 'Temporal smoothing',
        description:
            'Per-pixel change below which a difference is treated as jitter (use the slow rates). Start of the blend toward the fast rates.',
    },
    {
        key: 'maskTemporalMotionHigh',
        label: 'Motion threshold (high)',
        min: 0,
        max: 1,
        step: 0.01,
        category: 'Temporal smoothing',
        description:
            'Per-pixel change above which a difference is treated as real motion (use the fast rates). End of the blend from the slow rates.',
    },
    {
        key: 'maskClosingRadius',
        label: 'Morphological closing radius',
        min: 0,
        max: 8,
        step: 1,
        category: 'Mask shaping',
        integer: true,
        description:
            'Radius (mask texels) of the GPU close (dilate then erode) that fills transient holes punched in the mask during motion. 0 disables it; larger fills bigger dropouts but can bridge real gaps.',
    },
    {
        key: 'segmentationInputMaxEdge',
        label: 'Segmentation input max edge (px)',
        min: 128,
        max: 1024,
        step: 32,
        category: 'Segmentation',
        integer: true,
        description:
            'Longest edge (px) the frame is downscaled to before segmentation. Higher preserves thin features (hair, fingers) but costs more per frame.',
    },
    {
        key: 'segmentationFrameInterval',
        label: 'Segmentation frame interval',
        min: 1,
        max: 6,
        step: 1,
        category: 'Segmentation',
        integer: true,
        description:
            'Composited frames per segmentation request. 1 segments every frame; higher reuses the previous mask for the frames in between, cutting inference cost at the price of some silhouette staleness.',
    },
    {
        key: 'blurRadius',
        label: 'Blur radius',
        min: 0,
        max: 150,
        step: 1,
        category: 'Segmentation',
        integer: true,
        description: 'Gaussian blur strength applied to the background. 0 = no blur.',
    },
];

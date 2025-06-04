import { VideoPreset, VideoPresets } from 'livekit-client';

import { Quality, QualityScenarios } from './types';

const h90 = new VideoPreset(VideoPresets.h90.width, VideoPresets.h90.height, 80_000, 30);
const h180 = new VideoPreset(VideoPresets.h180.width, VideoPresets.h180.height, 100_000, 30);
const h360 = new VideoPreset(VideoPresets.h360.width, VideoPresets.h360.height, 250_000, 30);
const h720 = new VideoPreset(VideoPresets.h720.width, VideoPresets.h720.height, 1000_000, 30);

export const qualityConstants = {
    [QualityScenarios.ScreenShare]: {
        [Quality.Decreased]: h90,
        [Quality.Default]: h90,
        [Quality.Increased]: h180,
    },
    [QualityScenarios.LargeGrid]: {
        [Quality.Decreased]: h90,
        [Quality.Default]: h180,
        [Quality.Increased]: h360,
    },
    [QualityScenarios.Default]: {
        [Quality.Decreased]: h180,
        [Quality.Default]: h360,
        [Quality.Increased]: h360,
    },
};

export const screenShareQualityDetails = {
    [Quality.Decreased]: h360,
    [Quality.Default]: h720,
    [Quality.Increased]: VideoPresets.h1080,
};

export const audioQualityDetails = {
    [Quality.Decreased]: 24_000,
    [Quality.Default]: 48_000,
    [Quality.Increased]: 64_000,
};

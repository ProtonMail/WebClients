import { VideoPreset, VideoPresets } from '@proton-meet/livekit-client';

import { Quality, QualityScenarios } from './types';

const h180mb100 = new VideoPreset(VideoPresets.h180.width, VideoPresets.h180.height, 100_000, 30);
const h180mb125 = new VideoPreset(VideoPresets.h180.width, VideoPresets.h180.height, 125_000, 30);
const h540 = new VideoPreset(VideoPresets.h540.width, VideoPresets.h540.height, 250_000, 30);
const h1080portrait = new VideoPreset(VideoPresets.h1080.width, VideoPresets.h1080.height, 1_000_000, 30);
const h1080screenshare = new VideoPreset(VideoPresets.h1080.width, VideoPresets.h1080.height, 1_700_000, 30);

export const qualityConstants = {
    [QualityScenarios.ScreenShare]: {
        [Quality.Decreased]: h180mb100,
        [Quality.Default]: h180mb100,
        [Quality.Increased]: h180mb100,
    },
    [QualityScenarios.PortraitView]: {
        [Quality.Decreased]: h1080portrait,
        [Quality.Default]: h1080portrait,
        [Quality.Increased]: h1080portrait,
    },
    [QualityScenarios.MediumView]: {
        [Quality.Decreased]: h540,
        [Quality.Default]: h540,
        [Quality.Increased]: h540,
    },
    [QualityScenarios.SmallView]: {
        [Quality.Decreased]: h180mb125,
        [Quality.Default]: h180mb125,
        [Quality.Increased]: h180mb125,
    },
};

export const screenShareQualityDetails = {
    [Quality.Decreased]: h1080screenshare,
    [Quality.Default]: h1080screenshare,
    [Quality.Increased]: h1080screenshare,
};

export const audioQualityDetails = {
    [Quality.Decreased]: 24_000,
    [Quality.Default]: 48_000,
    [Quality.Increased]: 64_000,
};

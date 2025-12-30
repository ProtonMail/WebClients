import { VideoPreset, VideoPresets } from 'livekit-client';

import { QualityScenarios } from './types';

const h180mb125 = new VideoPreset(VideoPresets.h180.width, VideoPresets.h180.height, 125_000, 30);
const h540 = new VideoPreset(VideoPresets.h540.width, VideoPresets.h540.height, 250_000, 30);
const h1080portrait = new VideoPreset(VideoPresets.h1080.width, VideoPresets.h1080.height, 1_000_000, 30);

export const legacyQualityConstants = {
    [QualityScenarios.PortraitView]: h1080portrait,
    [QualityScenarios.MediumView]: h540,
    [QualityScenarios.SmallView]: h180mb125,
};

// Set bitrates for VP8 compatibility (VP9 will use less via adaptiveStream)
const h180 = new VideoPreset(VideoPresets.h180.width, VideoPresets.h180.height, 160_000, 30);
const h360 = new VideoPreset(VideoPresets.h360.width, VideoPresets.h360.height, 400_000, 30);
const h720portrait = new VideoPreset(VideoPresets.h720.width, VideoPresets.h720.height, 1_000_000, 30);
const h1080screenshare = new VideoPreset(VideoPresets.h1080.width, VideoPresets.h1080.height, 1_700_000, 30);

export const qualityConstants = {
    [QualityScenarios.PortraitView]: h720portrait,
    [QualityScenarios.MediumView]: h360,
    [QualityScenarios.SmallView]: h180,
};

export const screenShareQuality = h1080screenshare;

export const audioQuality = 48_000;

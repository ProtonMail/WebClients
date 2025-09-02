import { VideoPreset, VideoPresets } from '@proton-meet/livekit-client';

import { QualityScenarios } from './types';

const h180mb100 = new VideoPreset(VideoPresets.h180.width, VideoPresets.h180.height, 100_000, 30);
const h180mb125 = new VideoPreset(VideoPresets.h180.width, VideoPresets.h180.height, 125_000, 30);
const h540 = new VideoPreset(VideoPresets.h540.width, VideoPresets.h540.height, 250_000, 30);
const h1080portrait = new VideoPreset(VideoPresets.h1080.width, VideoPresets.h1080.height, 1_000_000, 30);
const h1080screenshare = new VideoPreset(VideoPresets.h1080.width, VideoPresets.h1080.height, 1_700_000, 30);

export const qualityConstants = {
    [QualityScenarios.ScreenShare]: h180mb100,
    [QualityScenarios.PortraitView]: h1080portrait,
    [QualityScenarios.MediumView]: h540,
    [QualityScenarios.SmallView]: h180mb125,
};

export const screenShareQuality = h1080screenshare;

export const audioQuality = 48_000;

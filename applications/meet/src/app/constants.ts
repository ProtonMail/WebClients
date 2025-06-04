import { VideoQuality } from 'livekit-client';
import { c } from 'ttag';

export const PAGE_DIMENSION = 3;

export const PAGE_SIZE = PAGE_DIMENSION * PAGE_DIMENSION;

export const screenSharePageSize = 3;

export const screenShareDoublePageSize = 6;

export const heightToVideoQuality: Record<number, VideoQuality> = {
    180: VideoQuality.LOW,
    360: VideoQuality.LOW,
    480: VideoQuality.LOW,
    540: VideoQuality.MEDIUM,
    720: VideoQuality.MEDIUM,
    1080: VideoQuality.HIGH,
    1440: VideoQuality.HIGH,
    2160: VideoQuality.HIGH,
};

export const videoQualities = [
    {
        label: c('Meet').t`Low (160p)`,
        value: { width: 160, height: 90 },
    },
    {
        label: c('Meet').t`SD (320p)`,
        value: { width: 320, height: 180 },
    },
    {
        label: c('Meet').t`SD (480p)`,
        value: { width: 640, height: 480 },
    },
    {
        label: c('Meet').t`qHD (540p)`,
        value: { width: 960, height: 540 },
    },
    {
        label: c('Meet').t`HD (720p)`,
        value: { width: 1280, height: 720 },
    },
    {
        label: c('Meet').t`HD (1080p)`,
        value: { width: 1920, height: 1080 },
    },
    {
        label: c('Meet').t`Quad HD (1440p)`,
        value: { width: 2560, height: 1440 },
    },
    {
        label: c('Meet').t`Ultra HD (2160p/4K)`,
        value: { width: 3840, height: 2160 },
    },
];

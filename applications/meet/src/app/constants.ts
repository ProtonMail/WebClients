import { VideoQuality } from 'livekit-client';
import { c } from 'ttag';

export const PAGE_SIZE = 16;

export const SCREEN_SHARE_PAGE_SIZE = 3;

export const SCREEN_SHARE_DOUBLE_PAGE_SIZE = 6;

export const JOIN_TITLE_TIMEOUT = 2000;

export const NOTIFICATION_PARTICIPANT_LIMIT = 10;

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
        label: c('l10n_nightly Info').t`Low (160p)`,
        value: { width: 160, height: 90 },
    },
    {
        label: c('l10n_nightly Info').t`SD (320p)`,
        value: { width: 320, height: 180 },
    },
    {
        label: c('l10n_nightly Info').t`SD (480p)`,
        value: { width: 640, height: 480 },
    },
    {
        label: c('l10n_nightly Info').t`qHD (540p)`,
        value: { width: 960, height: 540 },
    },
    {
        label: c('l10n_nightly Info').t`HD (720p)`,
        value: { width: 1280, height: 720 },
    },
    {
        label: c('l10n_nightly Info').t`HD (1080p)`,
        value: { width: 1920, height: 1080 },
    },
    {
        label: c('l10n_nightly Info').t`Quad HD (1440p)`,
        value: { width: 2560, height: 1440 },
    },
    {
        label: c('l10n_nightly Info').t`Ultra HD (2160p/4K)`,
        value: { width: 3840, height: 2160 },
    },
];

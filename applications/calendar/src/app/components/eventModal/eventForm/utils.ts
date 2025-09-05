import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

export const hasVideoConf = (
    conferenceId?: string,
    conferenceUrl?: string,
    conferenceProvider?: VIDEO_CONFERENCE_PROVIDER
) => {
    return !!(
        conferenceUrl &&
        conferenceId &&
        ((conferenceProvider as VIDEO_CONFERENCE_PROVIDER) === VIDEO_CONFERENCE_PROVIDER.ZOOM ||
            conferenceUrl.includes('zoom.us') ||
            (conferenceProvider as VIDEO_CONFERENCE_PROVIDER) === VIDEO_CONFERENCE_PROVIDER.PROTON_MEET)
    );
};

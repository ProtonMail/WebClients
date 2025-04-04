import { c } from 'ttag';

import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from './constants';

export const isVideoConfOnlyLink = (data: BaseMeetingUrls) => {
    return data.meetingUrl && !data.joiningInstructions && !data.meetingId && !data.password;
};

export const getVideoConfCopy = (service: VIDEO_CONF_SERVICES) => {
    if (service === VIDEO_CONF_SERVICES.GOOGLE_MEET) {
        return c('Google Meet').t`Join Google Meet`;
    }
    if (service === VIDEO_CONF_SERVICES.ZOOM) {
        return c('Zoom').t`Join Zoom meeting`;
    }
};

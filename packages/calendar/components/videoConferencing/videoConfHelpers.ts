import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from './constants';

export const isVideoConfOnlyLink = (data: BaseMeetingUrls) => {
    return data.meetingUrl && !data.joiningInstructions && !data.meetingId && !data.password;
};

export const getVideoConfCopy = (service: VIDEO_CONF_SERVICES) => {
    const labels = {
        [VIDEO_CONF_SERVICES.GOOGLE_MEET]: c('Google Meet').t`Join Google Meet`,
        [VIDEO_CONF_SERVICES.ZOOM]: c('Zoom').t`Join Zoom meeting`,
        [VIDEO_CONF_SERVICES.SLACK]: c('Slack').t`Join Slack huddle`,
        [VIDEO_CONF_SERVICES.TEAMS]: c('Teams').t`Join Teams meeting`,
        [VIDEO_CONF_SERVICES.PROTON_MEET]: c('l10n_nightly Action').t`Join with ${MEET_APP_NAME}`,
    };

    return labels[service];
};

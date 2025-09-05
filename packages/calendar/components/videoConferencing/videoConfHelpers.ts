import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { type BaseMeetingUrls, SEPARATOR_PROTON_EVENTS, VIDEO_CONF_SERVICES } from './constants';

export const isVideoConfOnlyLink = (data: BaseMeetingUrls) => {
    return data.meetingUrl && !data.joiningInstructions && !data.meetingId && !data.password;
};

export const getVideoConfCopy = (service: VIDEO_CONF_SERVICES) => {
    const labels = {
        [VIDEO_CONF_SERVICES.GOOGLE_MEET]: c('Google Meet').t`Join Google Meet`,
        [VIDEO_CONF_SERVICES.ZOOM]: c('Zoom').t`Join Zoom meeting`,
        [VIDEO_CONF_SERVICES.SLACK]: c('Slack').t`Join Slack huddle`,
        [VIDEO_CONF_SERVICES.TEAMS]: c('Teams').t`Join Teams meeting`,
        [VIDEO_CONF_SERVICES.PROTON_MEET]: c('Action').t`Join with ${MEET_APP_NAME}`,
    };

    return labels[service];
};

export const addVideoConfInfoToDescription = ({
    host,
    meedingURL,
    password,
    meetingId,
    description = '',
    provider,
}: {
    host?: string;
    meedingURL?: string;
    password?: string;
    meetingId?: string;
    description?: string;
    provider?: VIDEO_CONFERENCE_PROVIDER;
}): string => {
    const hasVideoConfInfo = !!(meetingId && meedingURL && provider);

    if (!hasVideoConfInfo) {
        return description;
    }

    const providerLabels = {
        [VIDEO_CONFERENCE_PROVIDER.ZOOM]: 'Zoom Meeting',
        [VIDEO_CONFERENCE_PROVIDER.PROTON_MEET]: MEET_APP_NAME,
    };

    const videoConfDetails = `
${SEPARATOR_PROTON_EVENTS}
Join ${providerLabels[provider]}: ${meedingURL} (ID: ${meetingId}${password ? `, passcode: ${password}` : ''})

${host ? `Meeting host: ${host}` : ''}
${SEPARATOR_PROTON_EVENTS}`;

    return description ? `${description}${videoConfDetails}` : videoConfDetails;
};

const videoConfInformationPattern = new RegExp(
    `\n?${SEPARATOR_PROTON_EVENTS}[\\s\\S]*?${SEPARATOR_PROTON_EVENTS}`,
    'g'
);
export const removeVideoConfInfoFromDescription = (description: string): string => {
    return description.replace(videoConfInformationPattern, '');
};

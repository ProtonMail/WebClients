import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const slackRegex = /\b(?:https?:\/\/)?app\.slack\.com\/huddle\/([^>\s,]+)/;

export const getSlackDataFromString = (text: string): BaseMeetingUrls => {
    const match = text.match(slackRegex);
    return {
        service: VIDEO_CONF_SERVICES.SLACK,
        meetingUrl: match?.[0],
    };
};

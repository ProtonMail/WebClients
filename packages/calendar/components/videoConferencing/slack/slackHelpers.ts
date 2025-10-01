import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const SLACK_REGEX_LOCATION = /\b(https:\/\/)?app\.slack\.com\/huddle\/([^>\s,]+)/;

const DEFAULT_MATCH_RESULT = {
    service: VIDEO_CONF_SERVICES.SLACK,
    meetingUrl: undefined,
};

export const getSlackDataFromString = (text: string): BaseMeetingUrls => {
    const [match, schemePart] = text.match(SLACK_REGEX_LOCATION) || [];

    if (!match) {
        return DEFAULT_MATCH_RESULT;
    }

    const meetingUrl = schemePart ? match : `https://${match}`;

    return {
        ...DEFAULT_MATCH_RESULT,
        meetingUrl,
    };
};

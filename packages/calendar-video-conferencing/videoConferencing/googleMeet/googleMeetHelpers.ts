import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const GOOGLE_MEET_REGEX_LOCATION = /(https:\/\/)?meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/;
const GOOGLE_MEET_REGEX_SUPPORT_URL = /https:\/\/support\.google\.com\/a\/users\/answer\/\d+/;

const DEFAULT_MATCH_RESULT = {
    service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
    meetingUrl: undefined,
    meetingId: undefined,
    joiningInstructions: undefined,
};

const getGoogleMeetData = (text: string, isDescription: boolean): BaseMeetingUrls => {
    const [match, schemePart, meetingId] = text.match(GOOGLE_MEET_REGEX_LOCATION) || [];

    if (!match) {
        return DEFAULT_MATCH_RESULT;
    }

    const meetingUrl = schemePart ? match : `https://${match}`;
    const joiningInstructions = isDescription ? text.match(GOOGLE_MEET_REGEX_SUPPORT_URL)?.[0] : undefined;
    return {
        ...DEFAULT_MATCH_RESULT,
        meetingUrl,
        meetingId,
        joiningInstructions,
    };
};

export const getGoogleMeetDataFromLocation = (location: string): BaseMeetingUrls => {
    return getGoogleMeetData(location, false);
};

export const getGoogleMeetDataFromDescription = (description: string): BaseMeetingUrls => {
    return getGoogleMeetData(description, true);
};

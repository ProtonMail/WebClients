import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const ZOOM_REGEX_LOCATION =
    /(https:\/\/)?(?:[a-zA-Z0-9.-]+\.)?zoom\.us\/(?:my|j)\/([a-zA-Z0-9]+)(?:\?pwd=([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?))?/;
const ZOOM_REGEX_PASSCODE = /passcode: (\w+)/i;
const ZOOM_REGEX_JOINING_INSTRUCTIONS =
    /Joining instructions: (https:\/\/www\.google\.com\/url\?q=https:\/\/applications\.zoom\.us\/addon\/invitation\/detail\?[^ ]+)/;

const DEFAULT_MATCH_RESULT = {
    service: VIDEO_CONF_SERVICES.ZOOM,
    meetingUrl: undefined,
    meetingId: undefined,
    password: undefined,
    joiningInstructions: undefined,
};

const getZoomData = (text: string, isDescription: boolean): BaseMeetingUrls => {
    const [match, schemePart, meetingId, locationPassword] = text.match(ZOOM_REGEX_LOCATION) ?? [];

    if (!match) {
        return DEFAULT_MATCH_RESULT;
    }

    const meetingUrl = schemePart ? match : `https://${match}`;
    const password = isDescription
        ? (text.match(ZOOM_REGEX_PASSCODE)?.[1].trim() ?? locationPassword)
        : locationPassword;
    const joiningInstructions = isDescription ? text.match(ZOOM_REGEX_JOINING_INSTRUCTIONS)?.[1].trim() : undefined;

    return {
        ...DEFAULT_MATCH_RESULT,
        meetingUrl,
        meetingId,
        password,
        joiningInstructions,
    };
};

export const getZoomDataFromLocation = (location: string): BaseMeetingUrls => {
    return getZoomData(location, false);
};

export const getZoomFromDescription = (description: string): BaseMeetingUrls => {
    return getZoomData(description, true);
};

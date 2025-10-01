import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const TEAMS_REGEX_LOCATION = /\b(https:\/\/)?teams\.live\.com\/meet\/([^?\s,]+)\?p=([^>\s,]+)/;
const TEAMS_REGEX_MEETING_ID = /Meeting ID:\s*([\d\s]+)/;
const TEAMS_REGEX_PASSWORD = /Passcode:\s*([\w]+)/;

const DEFAULT_MATCH_RESULT = {
    service: VIDEO_CONF_SERVICES.TEAMS,
    meetingUrl: undefined,
    meetingId: undefined,
    password: undefined,
};

const getTeamsData = (text: string, isDescription: boolean): BaseMeetingUrls => {
    const [match, schemePart, locationMeetingId, locationPassword] = text.match(TEAMS_REGEX_LOCATION) ?? [];

    if (!match) {
        return DEFAULT_MATCH_RESULT;
    }

    const meetingUrl = schemePart ? match : `https://${match}`;
    const meetingId = isDescription
        ? (text.match(TEAMS_REGEX_MEETING_ID)?.[1].trim() ?? locationMeetingId)
        : locationMeetingId;
    const password = isDescription
        ? (text.match(TEAMS_REGEX_PASSWORD)?.[1].trim() ?? locationPassword)
        : locationPassword;

    return {
        ...DEFAULT_MATCH_RESULT,
        meetingUrl,
        meetingId,
        password,
    };
};

export const getTeamsDataFromLocation = (location: string): BaseMeetingUrls => {
    return getTeamsData(location, false);
};

export const getTeamsDataFromDescription = (description: string): BaseMeetingUrls => {
    return getTeamsData(description, true);
};

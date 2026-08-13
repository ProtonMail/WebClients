import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

export const PROTON_MEET_REGEX_LOCATION = /(https:\/\/)?meet(?:\.\w+)?\..+\/join\/id-(\w+)#pwd-([^\s#]+)/;

const DEFAULT_MATCH_RESULT = {
    service: VIDEO_CONF_SERVICES.PROTON_MEET,
    meetingUrl: undefined,
    meetingId: undefined,
    password: undefined,
    joiningInstructions: undefined,
};

export const getProtonMeetData = (text: string): BaseMeetingUrls => {
    const [match, schemePart, meetingId] = text.match(PROTON_MEET_REGEX_LOCATION) ?? [];

    if (!match) {
        return DEFAULT_MATCH_RESULT;
    }

    const meetingUrl = schemePart ? match : `https://${match}`;

    return {
        ...DEFAULT_MATCH_RESULT,
        meetingUrl,
        meetingId,
        password: undefined,
        joiningInstructions: undefined,
    };
};

import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const GOOGLE_MEET_LOCATION = /(?:https?:\/\/)?meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/;
const GOOGLE_SUPPORT_URL = /https:\/\/support\.google\.com\/a\/users\/answer\/\d+/;

const getGoogleMeetData = (text: string, isDescription: boolean): BaseMeetingUrls => {
    const match = text.match(GOOGLE_MEET_LOCATION);
    const joiningInstructions = isDescription ? text.match(GOOGLE_SUPPORT_URL)?.[0] : undefined;
    return {
        service: VIDEO_CONF_SERVICES.GOOGLE_MEET,
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        joiningInstructions,
    };
};

export const getGoogleMeetDataFromLocation = (location: string): BaseMeetingUrls => {
    return getGoogleMeetData(location, false);
};

export const getGoogleMeetDataFromDescription = (description: string): BaseMeetingUrls => {
    return getGoogleMeetData(description, true);
};

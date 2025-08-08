import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

// Regular regex expecting a Zoom URL https://us05web.zoom.us/j/...
const ZOOM_REGEX_LOCATION =
    /(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+)\.zoom\.us\/j\/([a-zA-Z0-9]+)(?:\?pwd=([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?))?/;

// Regular regex expecting a Zoom URL https://zoom.us/j/...
const ZOOM_SIMPLER_REGEX_LOCATION =
    /(?:https?:\/\/)zoom\.us\/j\/([a-zA-Z0-9]+)(?:\?pwd=([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?))?/;

const ZOOM_PERSONAL_REGEX_LOCATION = /(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+)\.zoom\.us\/(?:my|j)\/([a-zA-Z0-9]+)/;

const ZOOM_REGEX_PASSCODE = /passcode: (\w+)/i;
const ZOOM_REGEX_JOINING_INSTRUCTIONS =
    /Joining instructions: (https:\/\/www\.google\.com\/url\?q=https:\/\/applications\.zoom\.us\/addon\/invitation\/detail\?[^ ]+)/;

export const getZoomDataFromLocation = (location: string): BaseMeetingUrls => {
    const match = location.match(ZOOM_REGEX_LOCATION);
    const matchSimpler = location.match(ZOOM_SIMPLER_REGEX_LOCATION);
    const matchPersonal = location.match(ZOOM_PERSONAL_REGEX_LOCATION);

    if (!match && matchSimpler) {
        return {
            service: VIDEO_CONF_SERVICES.ZOOM,
            meetingUrl: matchSimpler?.[0],
            meetingId: matchSimpler?.[1],
            password: match?.[2],
            joiningInstructions: undefined,
        };
    }

    if (!match && matchPersonal) {
        return {
            service: VIDEO_CONF_SERVICES.ZOOM,
            meetingUrl: matchPersonal?.[0],
            meetingId: matchPersonal?.[1],
            password: undefined,
            joiningInstructions: undefined,
        };
    }

    return {
        service: VIDEO_CONF_SERVICES.ZOOM,
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        password: match?.[2],
        joiningInstructions: undefined,
    };
};

export const getZoomFromDescription = (description: string): BaseMeetingUrls => {
    const match = description.match(ZOOM_REGEX_LOCATION);
    const matchSimpler = description.match(ZOOM_SIMPLER_REGEX_LOCATION);
    const matchPersonal = description.match(ZOOM_PERSONAL_REGEX_LOCATION);

    if (!match && matchSimpler) {
        return {
            service: VIDEO_CONF_SERVICES.ZOOM,
            meetingUrl: matchSimpler?.[0],
            meetingId: matchSimpler?.[1],
            password: description.match(ZOOM_REGEX_PASSCODE)?.[1].trim(),
            joiningInstructions: description.match(ZOOM_REGEX_JOINING_INSTRUCTIONS)?.[1].trim(),
        };
    }

    if (!match && matchPersonal) {
        return {
            service: VIDEO_CONF_SERVICES.ZOOM,
            meetingUrl: matchPersonal?.[0],
            meetingId: matchPersonal?.[1],
            password: undefined,
            joiningInstructions: undefined,
        };
    }

    return {
        service: VIDEO_CONF_SERVICES.ZOOM,
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        password: description.match(ZOOM_REGEX_PASSCODE)?.[1].trim(),
        joiningInstructions: description.match(ZOOM_REGEX_JOINING_INSTRUCTIONS)?.[1].trim(),
    };
};

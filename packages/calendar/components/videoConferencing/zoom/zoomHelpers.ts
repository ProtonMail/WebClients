import { type BaseMeetingUrls, SEPARATOR_PROTON_EVENTS, VIDEO_CONF_SERVICES } from '../constants';

const ZOOM_REGEX_LOCATION =
    /(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+)\.zoom\.us\/j\/([a-zA-Z0-9]+)(?:\?pwd=([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?))?/;

const ZOOM_REGEX_PASSCODE = /passcode: (\w+)/;
const ZOOM_REGEX_JOINING_INSTRUCTIONS =
    /Joining instructions: (https:\/\/www\.google\.com\/url\?q=https:\/\/applications\.zoom\.us\/addon\/invitation\/detail\?[^ ]+)/;

export const getZoomDataFromLocation = (location: string): BaseMeetingUrls => {
    const match = location.match(ZOOM_REGEX_LOCATION);

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

    return {
        service: VIDEO_CONF_SERVICES.ZOOM,
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        password: description.match(ZOOM_REGEX_PASSCODE)?.[1].trim(),
        joiningInstructions: description.match(ZOOM_REGEX_JOINING_INSTRUCTIONS)?.[1].trim(),
    };
};

export const addZoomInfoToDescription = ({
    host,
    meedingURL,
    password,
    meetingId,
    description = '',
}: {
    host?: string;
    meedingURL?: string;
    password?: string;
    meetingId?: string;
    description?: string;
}): string => {
    const hasZoomInfo = meetingId && meedingURL && password;
    if (!hasZoomInfo) {
        return description;
    }

    const zoomDetails = `
${SEPARATOR_PROTON_EVENTS}
Join Zoom Meeting: ${meedingURL} (ID: ${meetingId}, passcode: ${password})

${host ? `Meeting host: ${host}` : ''}
${SEPARATOR_PROTON_EVENTS}`;

    return description ? `${description}${zoomDetails}` : zoomDetails;
};

const zoomInformationPattern = new RegExp(`${SEPARATOR_PROTON_EVENTS}[\\s\\S]*?${SEPARATOR_PROTON_EVENTS}`, 'g');
export const removeZoomInfoFromDescription = (description: string): string => {
    return description.replace(zoomInformationPattern, '');
};

export const doesDescriptionContainZoomInfo = (description: string): boolean => {
    return !!description.match(zoomInformationPattern);
};

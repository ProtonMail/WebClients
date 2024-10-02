import type { BaseMeetingUrls } from '../constants';

const ZOOM_REGEX_LOCATION =
    /(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+)\.zoom\.us\/j\/([a-zA-Z0-9]+)(?:\?pwd=([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?))?/;

const ZOOM_REGEX_PASSCODE = /passcode: (\w+)/;
const ZOOM_REGEX_JOINING_INSTRUCTIONS =
    /Joining instructions: (https:\/\/www\.google\.com\/url\?q=https:\/\/applications\.zoom\.us\/addon\/invitation\/detail\?[^ ]+)/;

export interface ZoomUrls extends BaseMeetingUrls {
    password?: string;
}

export const getZoomDataFromLocation = (location: string): ZoomUrls => {
    const match = location.match(ZOOM_REGEX_LOCATION);

    return {
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        password: match?.[2],
        joiningInstructions: undefined,
    };
};

export const getZoomFromDescription = (description: string): ZoomUrls => {
    const match = description.match(ZOOM_REGEX_LOCATION);

    return {
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        password: description.match(ZOOM_REGEX_PASSCODE)?.[1].trim(),
        joiningInstructions: description.match(ZOOM_REGEX_JOINING_INSTRUCTIONS)?.[1].trim(),
    };
};

import type { EventModelReadView } from '@proton/shared/lib/interfaces/calendar/Event';

import type { BaseMeetingUrls } from './constants';
import { getGoogleMeetDataFromDescription, getGoogleMeetDataFromLocation } from './googleMeet/googleMeetHelpers';
import { getProtonMeetData } from './protonMeet/protonMeetHelpers';
import { getSlackDataFromString } from './slack/slackHelpers';
import { getTeamsDataFromDescription, getTeamsDataFromLocation } from './teams/teamsHelpers';
import { getZoomDataFromLocation, getZoomFromDescription } from './zoom/zoomHelpers';

const descriptionParserFunctions = [
    getProtonMeetData,
    getZoomFromDescription,
    getGoogleMeetDataFromDescription,
    getSlackDataFromString,
    getTeamsDataFromDescription,
];

const locationParserFunctions = [
    getProtonMeetData,
    getZoomDataFromLocation,
    getGoogleMeetDataFromLocation,
    getSlackDataFromString,
    getTeamsDataFromLocation,
];

const textMathchesParserFunctions = (text: string, parserFunctions: ((text: string) => BaseMeetingUrls)[]) => {
    if (!text) {
        return false;
    }

    return parserFunctions.some((parser) => !!parser(text).meetingUrl);
};

export const hasValidVideoConferenceInData = (model: EventModelReadView) => {
    return (
        textMathchesParserFunctions(model?.description, descriptionParserFunctions) ||
        textMathchesParserFunctions(model?.location, locationParserFunctions)
    );
};

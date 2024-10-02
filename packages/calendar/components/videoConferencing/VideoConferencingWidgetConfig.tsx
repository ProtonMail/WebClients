import useFlag from '@proton/unleash/useFlag';

import type { VideoConferenceLocation } from './VideoConferencingWidget';
import { VideoConferencingWidget } from './VideoConferencingWidget';
import { SEPARATOR_GOOGLE_EVENTS } from './constants';
import { getGoogleMeetDataFromDescription, getGoogleMeetDataFromLocation } from './googleMeet/googleMeetHelpers';
import { getZoomDataFromLocation, getZoomFromDescription } from './zoom/zoomHelpers';

interface Props {
    description?: string;
    location?: string;
    widgetLocation: VideoConferenceLocation;
}

const separatorRegex = new RegExp(SEPARATOR_GOOGLE_EVENTS);

export const VideoConferencingWidgetConfig = ({ description, location, widgetLocation }: Props) => {
    const videoConferenceWidget = useFlag('VideoConferenceWidget');
    if (!videoConferenceWidget) {
        return null;
    }

    if (!description && !location) {
        return null;
    }

    const googleMeetingDescriptionSeparator = separatorRegex.test(description ?? '');
    if (googleMeetingDescriptionSeparator && description) {
        if (description.includes('zoom.us')) {
            const data = getZoomFromDescription(description);
            return (
                <VideoConferencingWidget
                    service="zoom"
                    meetingUrl={data.meetingUrl}
                    joiningInstructions={data.joiningInstructions}
                    meetingId={data.meetingId}
                    password={data.password}
                    location={widgetLocation}
                />
            );
        } else if (description.includes('meet.google.com')) {
            const data = getGoogleMeetDataFromDescription(description);
            return (
                <VideoConferencingWidget
                    service="google-meet"
                    meetingUrl={data.meetingUrl}
                    joiningInstructions={data.joiningInstructions}
                    meetingId={data.meetingId}
                    location={widgetLocation}
                />
            );
        }
    }

    if (location && location.includes('meet.google.com')) {
        const data = getGoogleMeetDataFromLocation(location);
        return (
            <VideoConferencingWidget
                service="google-meet"
                meetingUrl={data.meetingUrl}
                joiningInstructions={data.joiningInstructions}
                meetingId={data.meetingId}
                location={widgetLocation}
            />
        );
    }

    if (location && location.includes('zoom.us')) {
        const data = getZoomDataFromLocation(location);
        return (
            <VideoConferencingWidget
                service="zoom"
                meetingUrl={data.meetingUrl}
                joiningInstructions={data.joiningInstructions}
                meetingId={data.meetingId}
                password={data.password}
                location={widgetLocation}
            />
        );
    }

    return null;
};

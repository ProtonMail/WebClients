import type { EventModelReadView, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';

import type { VideoConferenceLocation } from './VideoConferencingWidget';
import { VideoConferencingWidget } from './VideoConferencingWidget';
import { SEPARATOR_GOOGLE_EVENTS, VIDEO_CONF_SERVICES } from './constants';
import { getGoogleMeetDataFromDescription, getGoogleMeetDataFromLocation } from './googleMeet/googleMeetHelpers';
import { getVideoConferencingData } from './modelHelpers';
import { VideoConferenceSource, useVideoConfTelemetry } from './useVideoConfTelemetry';
import { getZoomDataFromLocation, getZoomFromDescription } from './zoom/zoomHelpers';

interface Props {
    model: EventModelReadView | VcalVeventComponent;
    description?: string;
    widgetLocation: VideoConferenceLocation;
}

const separatorRegex = new RegExp(SEPARATOR_GOOGLE_EVENTS);

export const VideoConferencingWidgetConfig = ({ model, widgetLocation }: Props) => {
    const { sendEventVideoConfSource } = useVideoConfTelemetry();
    const videoConferenceWidget = useFlag('VideoConferenceWidget');
    if (!videoConferenceWidget) {
        return null;
    }

    const { description, location, meetingId, meetingUrl, password, meetingHost } = getVideoConferencingData(model);

    // Native Zoom integration
    if (meetingId && meetingUrl) {
        sendEventVideoConfSource(VideoConferenceSource.int_zoom);
        return (
            <VideoConferencingWidget
                location={widgetLocation}
                data={{
                    service: VIDEO_CONF_SERVICES.ZOOM, // The only supported provider is Zoom for the moment
                    meetingId,
                    meetingUrl,
                    password,
                    meetingHost,
                }}
            />
        );
    }

    // Events containing a Google separator in the description field
    const googleMeetingDescriptionSeparator = separatorRegex.test(description ?? '');
    if (googleMeetingDescriptionSeparator && description) {
        if (description.includes('zoom.us')) {
            const data = getZoomFromDescription(description);
            sendEventVideoConfSource(VideoConferenceSource.google_zoom_desc);
            return <VideoConferencingWidget location={widgetLocation} data={data} />;
        } else if (description.includes('meet.google.com')) {
            const data = getGoogleMeetDataFromDescription(description);
            sendEventVideoConfSource(VideoConferenceSource.google_google_meet_desc);
            return <VideoConferencingWidget location={widgetLocation} data={data} />;
        }
    }

    // Event containing a location field with a supported video conferencing link
    if (location) {
        if (location.includes('meet.google.com')) {
            const data = getGoogleMeetDataFromLocation(location);
            sendEventVideoConfSource(VideoConferenceSource.google_google_meet_loc);
            return <VideoConferencingWidget location={widgetLocation} data={data} />;
        }

        if (location.includes('zoom.us')) {
            const data = getZoomDataFromLocation(location);
            sendEventVideoConfSource(VideoConferenceSource.google_zoom_loc);
            return <VideoConferencingWidget location={widgetLocation} data={data} />;
        }
    }

    sendEventVideoConfSource(VideoConferenceSource.no_video_conf);
    return null;
};

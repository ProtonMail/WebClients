import { useRef } from 'react';

import type { EventModelReadView, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';

import type { VideoConferenceLocation } from './VideoConferencingWidget';
import { VideoConferencingWidget } from './VideoConferencingWidget';
import { SEPARATOR_GOOGLE_EVENTS, VIDEO_CONF_SERVICES } from './constants';
import { getGoogleMeetDataFromDescription, getGoogleMeetDataFromLocation } from './googleMeet/googleMeetHelpers';
import { getVideoConferencingData } from './modelHelpers';
import { PROTON_MEET_REGEX_LOCATION, getProtonMeetData } from './protonMeet/protonMeetHelpers';
import { getSlackDataFromString } from './slack/slackHelpers';
import { getTeamsDataFromDescription, getTeamsDataFromLocation } from './teams/teamsHelpers';
import { VideoConferenceSource, useVideoConfTelemetry } from './useVideoConfTelemetry';
import { getZoomDataFromLocation, getZoomFromDescription } from './zoom/zoomHelpers';

interface Props {
    model: EventModelReadView | VcalVeventComponent;
    description?: string;
    widgetLocation: VideoConferenceLocation;
}

const separatorRegex = new RegExp(SEPARATOR_GOOGLE_EVENTS);

export const VideoConferencingWidgetConfig = ({ model, widgetLocation }: Props) => {
    const hasReported = useRef(false);

    const { sendEventVideoConfSource } = useVideoConfTelemetry();
    const videoConferenceWidget = useFlag('VideoConferenceWidget');

    // This is required to avoid sending multiple requests for the same event
    const sendTelemetryReport = (source: VideoConferenceSource) => {
        if (!hasReported.current) {
            sendEventVideoConfSource(source);
            hasReported.current = true;
        }
    };

    if (!videoConferenceWidget) {
        return null;
    }

    const data = getVideoConferencingData(model);

    const isProtonMeet = !!data.meetingUrl && !!data.meetingUrl.match(PROTON_MEET_REGEX_LOCATION);
    const isZoom = !!data.meetingUrl?.includes('zoom.us');

    // Native Zoom integration
    if (data.meetingId && isZoom) {
        sendTelemetryReport(VideoConferenceSource.int_zoom);
        return (
            <VideoConferencingWidget
                location={widgetLocation}
                data={{
                    ...data,
                    service: VIDEO_CONF_SERVICES.ZOOM, // The only supported provider is Zoom for the moment
                }}
            />
        );
    }

    // Proton Meet integration
    if (isProtonMeet) {
        sendTelemetryReport(VideoConferenceSource.int_proton_meet);
        return (
            <VideoConferencingWidget
                location={widgetLocation}
                data={{ ...data, service: VIDEO_CONF_SERVICES.PROTON_MEET }}
            />
        );
    }

    // Events containing a Google separator in the description field
    const googleMeetingDescriptionSeparator = separatorRegex.test(data.description ?? '');
    if (googleMeetingDescriptionSeparator && data.description) {
        if (data.description.includes('zoom.us')) {
            const zoomData = getZoomFromDescription(data.description);
            sendTelemetryReport(VideoConferenceSource.google_zoom_desc);
            return <VideoConferencingWidget location={widgetLocation} data={zoomData} />;
        }

        if (data.description.includes('meet.google.com')) {
            const googleData = getGoogleMeetDataFromDescription(data.description);
            sendTelemetryReport(VideoConferenceSource.google_google_meet_desc);
            return <VideoConferencingWidget location={widgetLocation} data={googleData} />;
        }
    }

    // Event containing a description field with a supported video conferencing link
    // We first parse the description as it contains more information than the location field
    if (data.description) {
        if (data.description.match(PROTON_MEET_REGEX_LOCATION)) {
            const protonMeetData = getProtonMeetData(data.description);
            sendTelemetryReport(VideoConferenceSource.proton_meet_desc);
            return <VideoConferencingWidget location={widgetLocation} data={protonMeetData} />;
        }

        if (data.description.includes('zoom.us')) {
            const zoomData = getZoomFromDescription(data.description);
            sendTelemetryReport(VideoConferenceSource.zoom_desc);
            return <VideoConferencingWidget location={widgetLocation} data={zoomData} />;
        }

        if (data.description.includes('meet.google.com')) {
            const googleData = getGoogleMeetDataFromDescription(data.description);
            sendTelemetryReport(VideoConferenceSource.google_meet_desc);
            return <VideoConferencingWidget location={widgetLocation} data={googleData} />;
        }

        if (data.description.includes('app.slack.com/huddle')) {
            const slackData = getSlackDataFromString(data.description);
            sendTelemetryReport(VideoConferenceSource.slack_desc);
            return <VideoConferencingWidget location={widgetLocation} data={slackData} />;
        }

        if (data.description.includes('teams.live.com/meet')) {
            const teamsData = getTeamsDataFromDescription(data.description);
            sendTelemetryReport(VideoConferenceSource.teams_desc);
            return <VideoConferencingWidget location={widgetLocation} data={teamsData} />;
        }
    }

    // Event containing a location field with a supported video conferencing link
    if (data.location) {
        if (data.location.match(PROTON_MEET_REGEX_LOCATION)) {
            const protonMeetData = getProtonMeetData(data.location);
            sendTelemetryReport(VideoConferenceSource.proton_meet_loc);
            return <VideoConferencingWidget location={widgetLocation} data={protonMeetData} />;
        }

        if (data.location.includes('zoom.us')) {
            const zoomData = getZoomDataFromLocation(data.location);
            sendTelemetryReport(VideoConferenceSource.zoom_loc);
            return <VideoConferencingWidget location={widgetLocation} data={zoomData} />;
        }

        if (data.location.includes('meet.google.com')) {
            const googleData = getGoogleMeetDataFromLocation(data.location);
            sendTelemetryReport(VideoConferenceSource.google_meet_loc);
            return <VideoConferencingWidget location={widgetLocation} data={googleData} />;
        }

        if (data.location.includes('app.slack.com/huddle')) {
            const slackData = getSlackDataFromString(data.location);
            sendTelemetryReport(VideoConferenceSource.slack_loc);
            return <VideoConferencingWidget location={widgetLocation} data={slackData} />;
        }

        if (data.location.includes('teams.live.com/meet')) {
            const teamsData = getTeamsDataFromLocation(data.location);
            sendTelemetryReport(VideoConferenceSource.teams_loc);
            return <VideoConferencingWidget location={widgetLocation} data={teamsData} />;
        }
    }

    sendTelemetryReport(VideoConferenceSource.no_video_conf);
    return null;
};

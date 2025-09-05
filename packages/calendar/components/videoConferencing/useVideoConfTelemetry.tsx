import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/components';
import type { TelemetryEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryCalendarVideoConferencing, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

export enum VideoConferenceSource {
    no_video_conf = 'no_video_conf',
    google_google_meet_desc = 'google_google_meet_desc',
    google_zoom_desc = 'google_zoom_desc',
    zoom_loc = 'zoom_loc',
    zoom_desc = 'zoom_desc',
    google_meet_desc = 'google_meet_desc',
    google_meet_loc = 'google_meet_loc',
    slack_desc = 'slack_desc',
    slack_loc = 'slack_loc',
    teams_desc = 'teams_desc',
    teams_loc = 'teams_loc',
    int_zoom = 'int_zoom',
    int_proton_meet = 'int_proton_meet',
    proton_meet_desc = 'proton_meet_desc',
    proton_meet_loc = 'proton_meet_loc',
}

export enum VideoConferenceZoomIntegration {
    add_zoom_meeting_button = 'add_zoom_meeting_button',
    free_mail_users_upsell = 'free_mail_users_upsell',
    oauth_modal_displayed = 'oauth_modal_displayed',
    remove_zoom_meeting_button = 'remove_zoom_meeting_button',
    create_zoom_meeting = 'create_zoom_meeting',
    create_zoom_meeting_failed = 'create_zoom_meeting_failed',
}

export enum VideoConferenceProtonMeetIntegration {
    create_proton_meet = 'create_proton_meet',
    create_proton_meet_failed = 'create_proton_meet_failed',
}

export const useVideoConfTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryEvents, dimensions?: SimpleMap<string>) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.calendarVideoConferencing,
            event,
            dimensions: dimensions,
            delay: false,
        });
    };

    const sendEventVideoConfSource = (source: VideoConferenceSource) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_widget, { videoConfSource: source });
    };

    const sendEventVideoConferenceSettingsToggle = (value: boolean) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_settings_toggle, {
            toggleValue: value ? 'on' : 'off',
        });
    };

    const sentEventZoom = (value: VideoConferenceZoomIntegration, errorCode?: string) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_zoom_integration, {
            eventType: value,
            errorCode,
        });
    };

    const sentEventProtonMeet = (value: VideoConferenceProtonMeetIntegration, errorCode?: string) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_proton_meet_integration, {
            eventType: value,
            errorCode,
        });
    };

    const sentEventProtonMeetSettingsToggle = (value: boolean) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_proton_meet_settings_toggle, {
            toggleValue: value ? 'on' : 'off',
        });
    };

    return {
        sendEventVideoConfSource,
        sendEventVideoConferenceSettingsToggle,
        sentEventZoom,
        sentEventProtonMeet,
        sentEventProtonMeetSettingsToggle,
    };
};

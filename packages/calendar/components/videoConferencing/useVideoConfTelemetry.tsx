import { useUser } from '@proton/account/user/hooks';
import { useApi, useSubscription, useUserSettings } from '@proton/components/index';
import type { TelemetryEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryCalendarVideoConferencing, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

export enum VideoConferenceSource {
    no_video_conf = 'no_video_conf',
    google_google_meet_desc = 'google_google_meet_desc',
    google_google_meet_loc = 'google_google_meet_loc',
    google_zoom_desc = 'google_zoom_desc',
    google_zoom_loc = 'google_zoom_loc',
    int_zoom = 'int_zoom',
}

export enum VideoConferenceZoomIntegration {
    add_zoom_meeting_button = 'add_zoom_meeting_button',
    free_mail_users_upsell = 'free_mail_users_upsell',
    oauth_modal_displayed = 'oauth_modal_displayed',
    remove_zoom_meeting_button = 'remove_zoom_meeting_button',
    create_zoom_meeting = 'create_zoom_meeting',
    create_zoom_meeting_failed = 'create_zoom_meeting_failed',
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
        });
    };

    const sendEventVideoConfSource = (source: VideoConferenceSource) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_widget, { video_conf_source: source });
    };

    const sendEventVideoConferenceSettingsToggle = (value: boolean) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_settings_toggle, {
            toggle_value: value ? 'on' : 'off',
        });
    };

    const sendEventVideoConferenceZoomIntegration = (value: VideoConferenceZoomIntegration, errorCode?: string) => {
        sendReport(TelemetryCalendarVideoConferencing.video_conference_zoom_integration, {
            event_type: value,
            error_code: errorCode,
        });
    };

    return {
        sendEventVideoConfSource,
        sendEventVideoConferenceSettingsToggle,
        sendEventVideoConferenceZoomIntegration,
    };
};

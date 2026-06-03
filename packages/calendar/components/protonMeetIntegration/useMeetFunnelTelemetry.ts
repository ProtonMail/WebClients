import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryMeetFunnelTelemetry } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import type { MeetSpotlightTypeVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

export const useMeetFunnelTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryMeetFunnelTelemetry, dimensions?: Record<string, string>) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.meetFunnelTelemetry,
            event,
            dimensions,
            delay: false,
        });
    };

    const sendSpotlightDisplayed = (variant: MeetSpotlightTypeVariant) => {
        sendReport(TelemetryMeetFunnelTelemetry.spotlight_displayed, { variant });
    };

    const sendExploreMeetClicked = () => {
        sendReport(TelemetryMeetFunnelTelemetry.explore_meet_clicked);
    };

    const sendMeetingCreated = () => {
        sendReport(TelemetryMeetFunnelTelemetry.meeting_created);
    };

    return {
        sendSpotlightDisplayed,
        sendExploreMeetClicked,
        sendMeetingCreated,
    };
};

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryMeetFunnelTelemetry } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

export const useMeetFunnelTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendMeetOpened = () => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.meetFunnelTelemetry,
            event: TelemetryMeetFunnelTelemetry.meet_opened,
            delay: false,
        });
    };

    return {
        sendMeetOpened,
    };
};

import { useUserSettings } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import type { PLANS } from '@proton/payments';
import { type TelemetryAlwaysOnUpsellEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

type TelemetryDimensions<T extends TelemetryAlwaysOnUpsellEvents> =
    T extends TelemetryAlwaysOnUpsellEvents.userSubscribed ? { plan: PLANS } : {};

export const useAlwaysOnUpsellTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    return <T extends TelemetryAlwaysOnUpsellEvents>(event: T, dimensions: TelemetryDimensions<T>) =>
        sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.alwaysOnUpsell,
            event,
            dimensions,
            delay: false,
        });
};

import { useUserSettings } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import type { PLANS } from '@proton/payments';
import { type TelemetryAlwaysOnUpsellEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

type TelemetryDimensions<T extends TelemetryAlwaysOnUpsellEvents> =
    T extends TelemetryAlwaysOnUpsellEvents.userSubscribed ? { plan: PLANS } : {};

export const useAlwaysOnUpsellTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();
    const { APP_NAME } = useConfig();

    return <T extends TelemetryAlwaysOnUpsellEvents>(event: T, dimensions: TelemetryDimensions<T>) =>
        sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.alwaysOnUpsell,
            event,
            dimensions: {
                ...dimensions,
                product: normalizeProduct(APP_NAME),
            },
            delay: false,
        });
};

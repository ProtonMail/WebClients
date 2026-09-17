import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { TelemetryEvents } from '@proton/shared/lib/api/telemetry';
import {
    TelemetryMeasurementGroups,
    TelemetryUnlimitedToDuoDiscountedOffer,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import { getBaseTelemetryDimensions } from '@proton/shared/lib/helpers/metrics';

export const useUnlimitedToDuoDiscountedTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();
    const { APP_NAME } = useConfig();

    const sendReport = (event: TelemetryEvents) => {
        if (!userSettings?.Telemetry) {
            return;
        }

        const silentApi = getSilentApi(api);

        void silentApi(
            sendTelemetryData({
                MeasurementGroup: TelemetryMeasurementGroups.unlimitedToDuoDiscountedOffer,
                Event: event,
                Dimensions: {
                    product: normalizeProduct(APP_NAME),
                    ...getBaseTelemetryDimensions({ user, subscription, userSettings }),
                },
            })
        );
    };

    return {
        sendReportClickTopNavbar: () => {
            sendReport(TelemetryUnlimitedToDuoDiscountedOffer.clickTopNavbar);
        },
        sendReportClickUpsellButton: () => {
            sendReport(TelemetryUnlimitedToDuoDiscountedOffer.clickUpsellButton);
        },
        sendReportCloseOffer: () => {
            sendReport(TelemetryUnlimitedToDuoDiscountedOffer.closeOffer);
        },
        sendReportClickHideOffer: () => {
            sendReport(TelemetryUnlimitedToDuoDiscountedOffer.clickHideOffer);
        },
        sendReportUserSubscribed: () => {
            sendReport(TelemetryUnlimitedToDuoDiscountedOffer.userSubscribed);
        },
    };
};

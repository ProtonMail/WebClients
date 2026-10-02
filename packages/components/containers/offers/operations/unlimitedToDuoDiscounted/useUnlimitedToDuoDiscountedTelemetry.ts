import { useMemo } from 'react';

import { useGetSubscription } from '@proton/account/subscription/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { useGetUserSettings } from '@proton/account/userSettings/hooks';
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
    const getUser = useGetUser();
    const getSubscription = useGetSubscription();
    const getUserSettings = useGetUserSettings();
    const { APP_NAME } = useConfig();

    return useMemo(() => {
        const sendReport = async (event: TelemetryEvents) => {
            const [user, subscription, userSettings] = await Promise.all([
                getUser(),
                getSubscription(),
                getUserSettings(),
            ]);

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
                void sendReport(TelemetryUnlimitedToDuoDiscountedOffer.clickTopNavbar);
            },
            sendReportClickUpsellButton: () => {
                void sendReport(TelemetryUnlimitedToDuoDiscountedOffer.clickUpsellButton);
            },
            sendReportCloseOffer: () => {
                void sendReport(TelemetryUnlimitedToDuoDiscountedOffer.closeOffer);
            },
            sendReportClickHideOffer: () => {
                void sendReport(TelemetryUnlimitedToDuoDiscountedOffer.clickHideOffer);
            },
            sendReportUserSubscribed: () => {
                void sendReport(TelemetryUnlimitedToDuoDiscountedOffer.userSubscribed);
            },
        };
    }, [api, getUser, getSubscription, getUserSettings, APP_NAME]);
};

import { useCallback } from 'react';

import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import type { TelemetryUnlimitedToDuoDiscountedOffer } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

interface TelemetryOptions {
    event: TelemetryUnlimitedToDuoDiscountedOffer;
}

export const useUnlimitedToDuoDiscountedTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();
    const { APP_NAME } = useConfig();

    const sendUnlimitedToDuoDiscountedReport = useCallback(
        ({ event }: TelemetryOptions) => {
            void sendTelemetryReportWithBaseDimensions({
                api,
                user,
                subscription,
                userSettings,
                measurementGroup: TelemetryMeasurementGroups.unlimitedToDuoDiscountedOffer,
                event,
                dimensions: {
                    product: normalizeProduct(APP_NAME),
                },
                delay: false,
            });
        },
        [api, user, subscription, userSettings, APP_NAME]
    );

    return { sendUnlimitedToDuoDiscountedReport };
};

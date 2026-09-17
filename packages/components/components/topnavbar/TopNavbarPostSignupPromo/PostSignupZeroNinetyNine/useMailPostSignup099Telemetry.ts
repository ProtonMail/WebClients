import { useUserSettings } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    type TelemetryEvents,
    TelemetryMailPostSignupZeroNinetyNineEvents,
    TelemetryMeasurementGroups,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';
import { getBaseTelemetryDimensions } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

import { getZeroNinetyNineOfferAgeCategory } from './zeroNinetyNineOfferState';

export const useMailPostSignup099Telemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryEvents, dimensions?: SimpleMap<string>) => {
        if (!userSettings?.Telemetry) {
            return;
        }

        const silentApi = getSilentApi(api);

        void silentApi(
            sendTelemetryData({
                MeasurementGroup: TelemetryMeasurementGroups.mailPostSignupZeroNinetyNine,
                Event: event,
                Dimensions: {
                    ...dimensions,
                    ...getBaseTelemetryDimensions({ user, subscription, userSettings }),
                },
            })
        );
    };

    const sendReportWithOfferAge = (event: TelemetryEvents, daysSinceOffer: number) => {
        sendReport(event, { daysSinceOffer: getZeroNinetyNineOfferAgeCategory(daysSinceOffer) });
    };

    return {
        sendReportAutomaticModalOpen: (daysSinceOffer: number) => {
            sendReportWithOfferAge(TelemetryMailPostSignupZeroNinetyNineEvents.automaticModalOpen, daysSinceOffer);
        },
        sendReportClickTopNavbar: (daysSinceOffer: number) => {
            sendReportWithOfferAge(TelemetryMailPostSignupZeroNinetyNineEvents.clickTopNavbar, daysSinceOffer);
        },
        sendReportClickUpsellButton: (daysSinceOffer: number) => {
            sendReportWithOfferAge(TelemetryMailPostSignupZeroNinetyNineEvents.clickUpsellButton, daysSinceOffer);
        },
        sendReportCloseOffer: (daysSinceOffer: number) => {
            sendReportWithOfferAge(TelemetryMailPostSignupZeroNinetyNineEvents.closeOffer, daysSinceOffer);
        },
        sendReportClickHideOffer: (daysSinceOffer: number) => {
            sendReportWithOfferAge(TelemetryMailPostSignupZeroNinetyNineEvents.clickHideOffer, daysSinceOffer);
        },
        sendReportUserSubscribed: (daysSinceOffer: number) => {
            sendReportWithOfferAge(TelemetryMailPostSignupZeroNinetyNineEvents.userSubscribed, daysSinceOffer);
        },
    };
};

import { useUserSettings } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import {
    type TelemetryEvents,
    TelemetryMailDrivePostSignupOneDollarEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import { type SimpleMap } from '@proton/shared/lib/interfaces';

import { getOfferAgeTelemetryCategory } from '../postSignupOffersHelpers';

export const useMailPostSignupOneDollarTelemetry = () => {
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
            measurementGroup: TelemetryMeasurementGroups.mailPostSignupOneDollar,
            event,
            dimensions,
            delay: false,
        });
    };

    const sendReportAutomaticModalOpen = (daysSinceOffer: number) => {
        sendReport(TelemetryMailDrivePostSignupOneDollarEvents.automaticModalOpen, {
            daysSinceOffer: getOfferAgeTelemetryCategory(daysSinceOffer),
        });
    };

    const sendReportClickUpsellButton = (daysSinceOffer: number) => {
        sendReport(TelemetryMailDrivePostSignupOneDollarEvents.clickUpsellButton, {
            daysSinceOffer: getOfferAgeTelemetryCategory(daysSinceOffer),
        });
    };

    const sendReportClickTopNavbar = (daysSinceOffer: number) => {
        sendReport(TelemetryMailDrivePostSignupOneDollarEvents.clickTopNavbar, {
            daysSinceOffer: getOfferAgeTelemetryCategory(daysSinceOffer),
        });
    };

    const sendReportCloseOffer = (daysSinceOffer: number) => {
        sendReport(TelemetryMailDrivePostSignupOneDollarEvents.closeOffer, {
            daysSinceOffer: getOfferAgeTelemetryCategory(daysSinceOffer),
        });
    };

    const sendReportUserSubscribed = (daysSinceOffer: number) => {
        sendReport(TelemetryMailDrivePostSignupOneDollarEvents.userSubscribed, {
            daysSinceOffer: getOfferAgeTelemetryCategory(daysSinceOffer),
        });
    };

    return {
        sendReportAutomaticModalOpen,
        sendReportClickUpsellButton,
        sendReportClickTopNavbar,
        sendReportCloseOffer,
        sendReportUserSubscribed,
    };
};

import { useUserSettings } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import {
    type TelemetryEvents,
    TelemetryMailPostSignupOneDollar,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import { type SimpleMap } from '@proton/shared/lib/interfaces';

const getDaySinceOfferCategory = (day: number) => {
    if (day >= 0 && day <= 4) {
        return '0-4';
    }
    if (day >= 5 && day <= 9) {
        return '5-9';
    }
    if (day >= 10 && day <= 14) {
        return '10-14';
    }
    if (day >= 15 && day <= 19) {
        return '15-19';
    }
    if (day >= 20 && day <= 24) {
        return '20-24';
    }
    return '25-30';
};

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
        sendReport(TelemetryMailPostSignupOneDollar.automaticModalOpen, {
            daysSinceOffer: getDaySinceOfferCategory(daysSinceOffer),
        });
    };

    const sendReportClickUpsellButton = (daysSinceOffer: number) => {
        sendReport(TelemetryMailPostSignupOneDollar.clickUpsellButton, {
            daysSinceOffer: getDaySinceOfferCategory(daysSinceOffer),
        });
    };

    const sendReportClickTopNavbar = (daysSinceOffer: number) => {
        sendReport(TelemetryMailPostSignupOneDollar.clickTopNavbar, {
            daysSinceOffer: getDaySinceOfferCategory(daysSinceOffer),
        });
    };

    const sendReportCloseOffer = (daysSinceOffer: number) => {
        sendReport(TelemetryMailPostSignupOneDollar.closeOffer, {
            daysSinceOffer: getDaySinceOfferCategory(daysSinceOffer),
        });
    };

    const sendReportUserSubscribed = (daysSinceOffer: number) => {
        sendReport(TelemetryMailPostSignupOneDollar.userSubscribed, {
            daysSinceOffer: getDaySinceOfferCategory(daysSinceOffer),
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

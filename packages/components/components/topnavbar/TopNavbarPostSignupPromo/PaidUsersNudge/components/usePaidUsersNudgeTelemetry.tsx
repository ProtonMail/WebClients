import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import { PLANS } from '@proton/payments';
import type { TelemetryPaidUsersNudge } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

import { OfferDuration, ReminderDates } from './interface';
import { isInWindow } from './paidUserNudgeHelper';

const getSubscriptionAgeGroup = (subscriptionAge: number) => {
    if (!isInWindow(subscriptionAge)) {
        return 'unknown';
    }

    if (subscriptionAge >= ReminderDates.day25 && subscriptionAge <= ReminderDates.day25 + OfferDuration) {
        return '25-39';
    }
    if (subscriptionAge >= ReminderDates.day90 && subscriptionAge <= ReminderDates.day90 + OfferDuration) {
        return '90-104';
    }
    if (subscriptionAge >= ReminderDates.day180 && subscriptionAge <= ReminderDates.day180 + OfferDuration) {
        return '180-194';
    }
    if (subscriptionAge >= ReminderDates.day365 && subscriptionAge <= ReminderDates.day365 + OfferDuration) {
        return '365-379';
    }

    return 'unknown';
};

export const usePaidUsersNudgeTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendPaidUserNudgeReport = (options: any) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.paidUsersNudge,
            event: options.event,
            dimensions: options.dimensions,
            delay: false,
        });
    };

    const sendMailPlusPaidUsersNudgeReport = (options: TelemetryOptions) => {
        void sendPaidUserNudgeReport({
            ...options,
            dimensions: {
                subscriptionAge: getSubscriptionAgeGroup(options.dimensions.subscriptionAge),
                plan: PLANS.MAIL,
                variant: options.dimensions.variant,
            },
        });
    };

    return {
        sendMailPlusPaidUsersNudgeReport,
    };
};

type TelemetryOptions =
    | {
          event: TelemetryPaidUsersNudge.clickTopNavbar;
          dimensions: { subscriptionAge: number; variant: string };
      }
    | {
          event: TelemetryPaidUsersNudge.clickUpsellButton;
          dimensions: { subscriptionAge: number; variant: string };
      }
    | {
          event: TelemetryPaidUsersNudge.closeOffer;
          dimensions: { subscriptionAge: number; variant: string };
      }
    | {
          event: TelemetryPaidUsersNudge.userSubscribed;
          dimensions: { subscriptionAge: number; variant: string };
      }
    | {
          event: TelemetryPaidUsersNudge.clickHideOffer;
          dimensions: { subscriptionAge: number; variant: string };
      };

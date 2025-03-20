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

    let value = 'unknown';
    Object.entries(ReminderDates).forEach((val) => {
        if (subscriptionAge >= val[1] && subscriptionAge <= val[1] + OfferDuration) {
            value = val[0];
        }
    });

    return value;
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
          dimensions: { subscriptionAge: number };
      }
    | {
          event: TelemetryPaidUsersNudge.clickUpsellButton;
          dimensions: { subscriptionAge: number };
      }
    | {
          event: TelemetryPaidUsersNudge.closeOffer;
          dimensions: { subscriptionAge: number };
      }
    | {
          event: TelemetryPaidUsersNudge.userSubscribed;
          dimensions: { subscriptionAge: number };
      }
    | {
          event: TelemetryPaidUsersNudge.clickHideOffer;
          dimensions: { subscriptionAge: number };
      };

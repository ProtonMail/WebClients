import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import { TelemetryPaidUsersNudge } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

import { OfferDuration, ReminderDates, type SupportedPlans } from '../helpers/interface';
import { isInWindow } from '../helpers/paidUserNudgeHelper';

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

interface Props {
    plan: SupportedPlans;
}

export const usePaidUsersNudgeTelemetry = ({ plan }: Props) => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendPaidUserNudgeReport = (options: TelemetryOptions) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.paidUsersNudge,
            event: options.event,
            dimensions: {
                subscriptionAge: getSubscriptionAgeGroup(options.dimensions.subscriptionAge),
                plan,
            },
            delay: false,
        });
    };

    const sendDrivePurchaseReport = () => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.paidUsersNudge,
            event: TelemetryPaidUsersNudge.userSubscribed,
            dimensions: {
                plan,
            },
            delay: false,
        });
    };

    return {
        sendPaidUserNudgeReport,
        sendDrivePurchaseReport,
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

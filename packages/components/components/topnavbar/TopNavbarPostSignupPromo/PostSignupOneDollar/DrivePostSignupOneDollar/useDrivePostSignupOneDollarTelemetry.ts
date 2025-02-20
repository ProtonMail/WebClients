import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import {
    type TelemetryMailDrivePostSignupOneDollarEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

import { getOfferAgeTelemetryCategory } from '../postSignupOffersHelpers';

export const useDrivePostSignupOneDollarTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReportDrivePostSignup = (options: TelemetryOptions) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.drivePostSignupOneDollar,
            event: options.event,
            dimensions:
                'daysSinceOffer' in options.dimensions
                    ? {
                          daysSinceOffer: getOfferAgeTelemetryCategory(options.dimensions.daysSinceOffer),
                      }
                    : undefined,
            delay: false,
        });
    };

    return { sendReportDrivePostSignup };
};

type TelemetryOptions =
    | {
          event: TelemetryMailDrivePostSignupOneDollarEvents.automaticModalOpen;
          dimensions: { daysSinceOffer: number };
      }
    | {
          event: TelemetryMailDrivePostSignupOneDollarEvents.clickUpsellButton;
          dimensions: { daysSinceOffer: number };
      }
    | {
          event: TelemetryMailDrivePostSignupOneDollarEvents.clickTopNavbar;
          dimensions: { daysSinceOffer: number };
      }
    | {
          event: TelemetryMailDrivePostSignupOneDollarEvents.closeOffer;
          dimensions: { daysSinceOffer: number };
      }
    | {
          event: TelemetryMailDrivePostSignupOneDollarEvents.userSubscribed;
          dimensions: {};
      };

import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import type { TelemetryUnlimitedToDuoOffer } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

import type { UnlimitedToDuoMessageType } from '../helpers/interface';

export const useUnlimitedToDuoOfferTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();
    const { APP_NAME } = useConfig();

    const sendTelemetryReportUnlimitedToDuo = (options: TelemetryOptions) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.unlimitedOffer2025,
            event: options.event,
            dimensions: {
                messageType: options.dimensions.messageType,
                product: normalizeProduct(APP_NAME),
            },
            delay: false,
        });
    };

    return { sendTelemetryReportUnlimitedToDuo };
};

type TelemetryOptions =
    | {
          event: TelemetryUnlimitedToDuoOffer.clickHideOffer;
          dimensions: { messageType: UnlimitedToDuoMessageType };
      }
    | {
          event: TelemetryUnlimitedToDuoOffer.clickUpsellButton;
          dimensions: { messageType: UnlimitedToDuoMessageType };
      }
    | {
          event: TelemetryUnlimitedToDuoOffer.clickTopNavbar;
          dimensions: { messageType: UnlimitedToDuoMessageType };
      }
    | {
          event: TelemetryUnlimitedToDuoOffer.closeOffer;
          dimensions: { messageType: UnlimitedToDuoMessageType };
      }
    | {
          event: TelemetryUnlimitedToDuoOffer.userSubscribed;
          dimensions: { messageType: UnlimitedToDuoMessageType };
      };

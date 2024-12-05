import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import { type TelemetryMailPostSubscriptionEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

export const usePostSubscriptionTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    return (options: Options) =>
        sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.mailPostSubscriptionEvents,
            event: options.event,
            dimensions: 'dimensions' in options ? options.dimensions : undefined,
        });
};

type Options =
    | {
          event: TelemetryMailPostSubscriptionEvents.replaced_default_short_domain_address;
          dimensions: Pick<Dimensions, 'isForCustomDomain'>;
      }
    | {
          event: TelemetryMailPostSubscriptionEvents.modal_engagement;
          dimensions: Pick<Dimensions, 'modal' | 'modalAction'>;
      }
    | {
          event: TelemetryMailPostSubscriptionEvents.post_subscription_start;
          dimensions: Pick<Dimensions, 'modal'>;
      };

type Dimensions = {
    modal: 'mail-short-domain' | 'mail-auto-delete' | 'mail-folders-and-labels' | 'dark-web-monitoring' | 'sentinel';
    modalAction: 'primary_cta' | 'secondary_cta' | 'close_button';
    isForCustomDomain: 'true' | 'false';
};

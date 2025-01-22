import { useUserSettings } from '@proton/account/index';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { PostSubscriptionFlowName } from '@proton/components/containers/payments/subscription/postSubscription/interface';
import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, type TelemetryPostSubscriptionTourEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import type { Optional } from '@proton/shared/lib/interfaces';

export const usePostSubscriptionTourTelemetry = () => {
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
            measurementGroup: TelemetryMeasurementGroups.postSubscriptionTourEvents,
            event: options.event,
            dimensions: 'dimensions' in options ? options.dimensions : undefined,
            delay: false,
        });
};

type Options =
    | {
          event: TelemetryPostSubscriptionTourEvents.post_subscription_action;
          dimensions: Optional<Pick<Dimensions, 'postSubscriptionAction' | 'flow' | 'upsellRef'>, 'upsellRef'>;
      }
    | {
          event: TelemetryPostSubscriptionTourEvents.start_feature_tour;
          dimensions: Pick<Dimensions, 'origin'>;
      }
    | {
          event: TelemetryPostSubscriptionTourEvents.quit_feature_tour;
          dimensions: Pick<
              Dimensions,
              'origin' | 'activatedStepShortDomain' | 'activatedStepAutoDelete' | 'activatedStepDarkWebMonitoring'
          >;
      }
    | {
          event: TelemetryPostSubscriptionTourEvents.finish_feature_tour;
          dimensions: Pick<
              Dimensions,
              'origin' | 'activatedStepShortDomain' | 'activatedStepAutoDelete' | 'activatedStepDarkWebMonitoring'
          >;
      }
    | {
          event: TelemetryPostSubscriptionTourEvents.replaced_default_short_domain_address;
          dimensions: Pick<Dimensions, 'isForCustomDomain'>;
      };

type Dimensions = {
    plan: string;
    flow: PostSubscriptionFlowName;
    upsellRef: string;
    postSubscriptionAction: 'startFeatureTour' | 'remindMeLater' | 'closeModal' | 'createLabel' | 'createFolder';
    /**
     * value should always be defined
     * `undefined` is added to match type of origin value in featureTourState
     */
    origin: 'postSubscription' | 'drawer' | undefined;
    activatedStepShortDomain: 'yes' | 'no';
    activatedStepAutoDelete: 'yes' | 'no';
    activatedStepDarkWebMonitoring: 'yes' | 'no';
    isForCustomDomain: 'yes' | 'no';
};

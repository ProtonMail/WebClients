import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/components';
import type { TelemetryPassNudgeEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

type InteractionType = 'dismiss' | 'more_info' | 'dont_show';

type Dimensions = {
    is_user_free: string;
    is_pass_user: string;
    interaction_type?: InteractionType;
    source: 'mail';
};

type Options =
    | {
          event: TelemetryPassNudgeEvents.banner_display;
          dimensions: Pick<Dimensions, 'is_user_free' | 'is_pass_user' | 'source'>;
      }
    | {
          event: TelemetryPassNudgeEvents.banner_interaction;
          dimensions: Pick<Dimensions, 'is_user_free' | 'is_pass_user' | 'interaction_type' | 'source'>;
      }
    | {
          event: TelemetryPassNudgeEvents.pass_cta_click;
          dimensions: Pick<Dimensions, 'is_user_free' | 'is_pass_user' | 'source'>;
      };

const usePassNudgeTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();

    return (options: Options) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.passNudge,
            event: options.event,
            dimensions: options.dimensions,
            delay: false,
        });
    };
};

export default usePassNudgeTelemetry;

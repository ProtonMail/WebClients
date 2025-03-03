import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/components';
import type { TelemetryPassNudgeEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

/**
 * Interaction types for Pass nudge telemetry
 */
export enum PASS_NUDGE_INTERACTION_TYPE {
    DISMISS_FOR_30_DAYS = 'dismiss_for_30_days',
    MORE_INFO = 'more_info',
    DONT_SHOW_FOREVER = 'dont_show_forever',
}

/**
 * Source identifier for telemetry
 */
export const PASS_NUDGE_SOURCE = 'mail';

type InteractionType =
    | PASS_NUDGE_INTERACTION_TYPE.DISMISS_FOR_30_DAYS
    | PASS_NUDGE_INTERACTION_TYPE.MORE_INFO
    | PASS_NUDGE_INTERACTION_TYPE.DONT_SHOW_FOREVER;

type Dimensions = {
    isUserFree: string;
    isPassUser: string;
    interactionType?: InteractionType;
    source: typeof PASS_NUDGE_SOURCE;
};

type Options =
    | {
          event: TelemetryPassNudgeEvents.banner_display;
          dimensions: Pick<Dimensions, 'isPassUser' | 'source'>;
      }
    | {
          event: TelemetryPassNudgeEvents.banner_interaction;
          dimensions: Pick<Dimensions, 'isPassUser' | 'interactionType' | 'source'>;
      }
    | {
          event: TelemetryPassNudgeEvents.pass_cta_click;
          dimensions: Pick<Dimensions, 'isPassUser' | 'source'>;
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

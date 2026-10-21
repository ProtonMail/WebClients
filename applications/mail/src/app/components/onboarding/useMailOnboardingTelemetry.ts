import { organizationThunk } from '@proton/account/organization';
import { useApi } from '@proton/app-context/useApi';
import { PLANS } from '@proton/payments/core/constants';
import { type OldTelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { useMailDispatch } from '../../store/hooks';
import type { OnlineServicesKey } from './checklist/constants';

type SendTelemetryCallback = <TEvent extends OldTelemetryMailOnboardingEvents>(
    event: TEvent,
    dimensionsParam: Omit<Extract<Options, { event: TEvent }>['dimensions'], 'plan' | 'variant'>
) => Promise<void>;

export const useMailOnboardingTelemetry = (): SendTelemetryCallback => {
    const api = useApi();
    const dispatch = useMailDispatch();

    const sendTelemetry: SendTelemetryCallback = async (
        event,
        /** No need to send variant and plan in the dimensions they're fetched at hook instanciation level */
        dimensionsParam
    ) => {
        const organization = await dispatch(organizationThunk());

        return sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.oldMailOnboarding,
            event,
            silence: true,
            dimensions: {
                ...dimensionsParam,
                plan: organization?.PlanName || PLANS.FREE,
                variant: 'new',
            },
            delay: false,
        });
    };

    return sendTelemetry;
};

type Options =
    | {
          event: OldTelemetryMailOnboardingEvents.start_onboarding_modals;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.finish_onboarding_modals;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.select_theme;
          dimensions: Pick<Dimensions, 'plan' | 'theme' | 'is_default_theme'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.enable_gmail_forwarding;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.change_login;
          dimensions: Pick<Dimensions, 'plan' | 'service'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.change_login_checklist;
          dimensions: Pick<Dimensions, 'plan' | 'service_checklist' | 'service_checklist_button'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.finish_change_login;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.download_desktop_app;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.close_checklist;
          dimensions: Pick<
              Dimensions,
              | 'plan'
              | 'checklist_step_privacy_completed'
              | 'checklist_step_import_completed'
              | 'checklist_step_update_login_completed'
              | 'checklist_step_mobile_app_completed'
          >;
      }
    | {
          event: OldTelemetryMailOnboardingEvents.premium_features;
          dimensions: Pick<
              Dimensions,
              'plan' | 'feature_short_domain' | 'feature_auto_delete' | 'feature_dark_web_monitoring'
          >;
      };

type Dimensions = {
    plan: `${PLANS}`;
    theme: `${ThemeTypes}`;
    is_default_theme: 'yes' | 'no';
    service: OnlineServicesKey;
    service_checklist: OnlineServicesKey;
    service_checklist_button: 'done' | 'change_email';
    feature_short_domain: 'yes' | 'no';
    feature_dark_web_monitoring: 'yes' | 'no';
    feature_auto_delete: 'yes' | 'no';
    checklist_step_privacy_completed: 'yes' | 'no';
    checklist_step_import_completed: 'yes' | 'no';
    checklist_step_update_login_completed: 'yes' | 'no';
    checklist_step_mobile_app_completed: 'yes' | 'no';
};

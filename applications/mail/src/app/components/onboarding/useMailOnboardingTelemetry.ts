import { organizationThunk } from '@proton/account/organization';
import { useApi } from '@proton/components';
import { PLANS } from '@proton/payments';
import { type TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { useMailDispatch } from 'proton-mail/store/hooks';

import type { OnlineServicesKey } from './checklist/constants';

type SendTelemetryCallback = <TEvent extends TelemetryMailOnboardingEvents>(
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
            measurementGroup: TelemetryMeasurementGroups.mailOnboarding,
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
          event: TelemetryMailOnboardingEvents.start_onboarding_modals;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.finish_onboarding_modals;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.select_theme;
          dimensions: Pick<Dimensions, 'plan' | 'theme' | 'is_default_theme'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.enable_gmail_forwarding;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.change_login;
          dimensions: Pick<Dimensions, 'plan' | 'service'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.change_login_checklist;
          dimensions: Pick<Dimensions, 'plan' | 'service_checklist' | 'service_checklist_button'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.finish_change_login;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.download_desktop_app;
          dimensions: Pick<Dimensions, 'plan'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.close_checklist;
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
          event: TelemetryMailOnboardingEvents.premium_features;
          dimensions: Pick<
              Dimensions,
              'plan' | 'feature_short_domain' | 'feature_auto_delete' | 'feature_dark_web_monitoring'
          >;
      };

type Dimensions = {
    plan: `${PLANS}`;
    theme: `${ThemeTypes}`;
    is_default_theme: 'yes' | 'no';
    service: AllowedServices;
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

type AllowedServices = Extract<
    OnlineServicesKey,
    | 'amazon'
    | 'ebay'
    | 'aliexpress'
    | 'facebook'
    | 'instagram'
    | 'tiktok'
    | 'bank-of-america'
    | 'american-express'
    | 'capital-one'
    | 'hsbc'
    | 'barclays'
    | 'lloyds'
    | 'bnp-paribas'
    | 'credit-agricole'
    | 'banque-populaire'
    | 'deutsche-bank'
    | 'dz-bank'
    | 'kfw'
    | 'santander'
    | 'bbva'
    | 'caixa-bank'
    | 'ubs'
    | 'raiffeisen'
    | 'zurcher-kantonalbank'
>;

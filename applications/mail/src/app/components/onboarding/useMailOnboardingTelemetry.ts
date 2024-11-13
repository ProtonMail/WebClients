import { useCallback } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useApi } from '@proton/components';
import { PLANS } from '@proton/payments';
import { TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { ThemeTypes } from '@proton/shared/lib/themes/themes';
import type { MailOnboardingVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

import { type OnlineServicesKey } from './checklist/constants';
import useMailOnboardingVariant from './useMailOnboardingVariant';

type SendTelemetryCallback = <TEvent extends TelemetryMailOnboardingEvents>(
    event: TEvent,
    dimensionsParam: Omit<Extract<Options, { event: TEvent }>['dimensions'], 'variant' | 'plan'>
) => Promise<void>;

const eventShouldNotBeSent = (variant: MailOnboardingVariant, event: TelemetryMailOnboardingEvents) => {
    if (variant === 'none') {
        // Those events are not sent when variant is `none`
        return [
            TelemetryMailOnboardingEvents.start_onboarding_modals,
            TelemetryMailOnboardingEvents.finish_onboarding_modals,
        ].includes(event);
    }
    return false;
};

export const useMailOnboardingTelemetry = (): [sendTelemetry: SendTelemetryCallback, loadingDeps: boolean] => {
    const api = useApi();
    const { variant, isEnabled: isOnboardingVariantsFeatureEnabled } = useMailOnboardingVariant();
    const [organization, loadingOrg] = useOrganization();
    const userPlan = organization?.PlanName || PLANS.FREE;

    const sendTelemetry = useCallback<SendTelemetryCallback>(
        (
            event,
            /** No need to send variant and plan in the dimensions they're fetched at hook instanciation level */
            dimensionsParam
        ) => {
            if (!isOnboardingVariantsFeatureEnabled || eventShouldNotBeSent(variant, event)) {
                return Promise.resolve();
            }

            if (loadingOrg) {
                captureMessage('useTelemetryOnboarding: Data is still loading, failled to send ' + event);
                return Promise.resolve();
            }

            const dimensions = {
                ...dimensionsParam,
                plan: userPlan,
                variant,
            };

            return sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.mailOnboarding,
                event,
                silence: true,
                dimensions,
            });
        },
        [variant, userPlan]
    );

    return [sendTelemetry, loadingOrg];
};

type Options =
    | {
          event: TelemetryMailOnboardingEvents.start_onboarding_modals;
          dimensions: Pick<Dimensions, 'plan' | 'variant'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.finish_onboarding_modals;
          dimensions: Pick<Dimensions, 'plan' | 'variant'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.select_theme;
          dimensions: Pick<Dimensions, 'plan' | 'variant' | 'theme' | 'is_default_theme'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.enable_gmail_forwarding;
          dimensions: Pick<Dimensions, 'plan' | 'variant'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.change_login;
          dimensions: Pick<Dimensions, 'plan' | 'variant' | 'service'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.change_login_checklist;
          dimensions: Pick<Dimensions, 'plan' | 'variant' | 'service_checklist' | 'service_checklist_button'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.finish_change_login;
          dimensions: Pick<Dimensions, 'plan' | 'variant'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.download_desktop_app;
          dimensions: Pick<Dimensions, 'plan' | 'variant'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.clicked_checklist_setting;
          dimensions: Pick<Dimensions, 'plan' | 'variant' | 'is_checklist_completed'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.close_checklist;
          dimensions: Pick<
              Dimensions,
              | 'plan'
              | 'variant'
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
              'plan' | 'variant' | 'feature_short_domain' | 'feature_auto_delete' | 'feature_dark_web_monitoring'
          >;
      };

type Dimensions = {
    plan: `${PLANS}`;
    variant: MailOnboardingVariant;
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
    is_checklist_completed: 'yes' | 'no';
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

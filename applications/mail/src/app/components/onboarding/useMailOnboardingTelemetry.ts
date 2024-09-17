import { useCallback } from 'react';

import { useApi, useOrganization } from '@proton/components/hooks';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { PLANS } from '@proton/shared/lib/constants';
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

export const useMailOnboardingTelemetry = (): [sendTelemetry: SendTelemetryCallback, loadingDeps: boolean] => {
    const api = useApi();
    const { variant, isEnabled } = useMailOnboardingVariant();
    const [organization, loadingOrg] = useOrganization();
    const userPlan = organization?.PlanName || PLANS.FREE;

    const sendTelemetry = useCallback<SendTelemetryCallback>(
        (
            event,
            /** No need to send variant and plan in the dimensions they're fetched at hook instanciation level */
            dimensionsParam
        ) => {
            if (loadingOrg) {
                captureMessage('useTelemetryOnboarding: Data is still loading, failled to send ' + event);
                return Promise.resolve();
            }

            if (
                // We don't want to send telemetry for those events if the variant is "none"
                ([
                    TelemetryMailOnboardingEvents.start_onboarding_modals,
                    TelemetryMailOnboardingEvents.finish_onboarding_modals,
                ].includes(event) &&
                    variant === 'none') ||
                // We don't want to send telemetry if the feature is disabled
                !isEnabled
            ) {
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
          event: TelemetryMailOnboardingEvents.finish_change_login;
          dimensions: Pick<Dimensions, 'plan' | 'variant'>;
      }
    | {
          event: TelemetryMailOnboardingEvents.download_desktop_app;
          dimensions: Pick<Dimensions, 'plan' | 'variant'>;
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
    feature_short_domain: 'yes' | 'no';
    feature_dark_web_monitoring: 'yes' | 'no';
    feature_auto_delete: 'yes' | 'no';
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

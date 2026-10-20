import type { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import noop from '@proton/utils/noop';

import type { TelemetryDownloadExtension } from '../../../single-signup-v2/measure';

type OnboardingVariant = 'old' | 'new';

type SignupFlow = 'pass_ctx_signup' | 'pass_signup_v2';

const DEFAULT_SIGNUP_FLOW: SignupFlow = 'pass_ctx_signup';

export const getSignupFlow = (value: string | null): SignupFlow =>
    value === 'pass_signup_v2' ? value : DEFAULT_SIGNUP_FLOW;

type PassSignupCtxTelemetryData = { flow: SignupFlow } & (
    | {
          event: TelemetryAccountSignupEvents.onboardFinish;
          dimensions: {
              onboarding: OnboardingVariant;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.interactDownload;
          dimensions: {
              click: TelemetryDownloadExtension;
              onboarding: OnboardingVariant;
          };
      }
);

export const measureSignupCtx = async (api: Api, { flow, ...data }: PassSignupCtxTelemetryData) => {
    return sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.accountSignup,
        event: data.event,
        dimensions: { flow, ...('dimensions' in data ? data.dimensions : {}) },
        delay: false,
    }).catch(noop);
};

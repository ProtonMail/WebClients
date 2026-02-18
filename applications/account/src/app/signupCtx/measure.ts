import type { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { TelemetryDownloadExtension } from '../single-signup-v2/measure';

// In the future more products can be added here
export type SignupCtxFlow = 'pass_ctx_signup';

export type SignupCtxTelemetryData =
    | {
          event: TelemetryAccountSignupEvents.onboardFinish;
          dimensions: {
              flow: SignupCtxFlow;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.interactDownload;
          dimensions: {
              flow: SignupCtxFlow;
              click: TelemetryDownloadExtension;
          };
      };

export const measureSignupCtx = (api: Api, data: SignupCtxTelemetryData) => {
    return sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.accountSignup,
        event: data.event,
        dimensions: data.dimensions,
        delay: false,
    }).catch(noop);
};

import type { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { TelemetryDownloadExtension } from '../../../single-signup-v2/measure';

type PassSignupCtxTelemetryData =
    | {
          event: TelemetryAccountSignupEvents.onboardFinish;
      }
    | {
          event: TelemetryAccountSignupEvents.interactDownload;
          dimensions: {
              click: TelemetryDownloadExtension;
          };
      };

export const measureSignupCtx = async (api: Api, data: PassSignupCtxTelemetryData) => {
    return sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.accountSignup,
        event: data.event,
        dimensions: { flow: 'pass_ctx_signup', ...('dimensions' in data ? data.dimensions : {}) },
        delay: false,
    }).catch(noop);
};

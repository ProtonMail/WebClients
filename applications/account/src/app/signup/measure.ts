import type { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';

import type { SignupFinishEvents } from '../single-signup-v2/measure';

export type TelemetryMeasurementData =
    | {
          event: TelemetryAccountSignupEvents.pageLoad;
          dimensions: {};
      }
    | SignupFinishEvents;

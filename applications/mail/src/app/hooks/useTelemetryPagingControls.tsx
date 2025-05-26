import { useApi } from '@proton/components';
import type { TelemetryMailPagingControlsEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

type TelemetryPagingControlsOptions =
    | {
          event: TelemetryMailPagingControlsEvents.move_to_previous_page;
      }
    | {
          event: TelemetryMailPagingControlsEvents.move_to_next_page;
      }
    | {
          event: TelemetryMailPagingControlsEvents.clicked_load_more_search_results;
      }
    | {
          event: TelemetryMailPagingControlsEvents.move_to_custom_page;
          dimensions: { isPageConsecutive: 'true' | 'false' };
      };

const useTelemetryPagingControls = () => {
    const api = useApi();

    return (options: TelemetryPagingControlsOptions) =>
        sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailPagingControls,
            event: options.event,
            dimensions: 'dimensions' in options ? options.dimensions : undefined,
            delay: false,
        });
};

export default useTelemetryPagingControls;

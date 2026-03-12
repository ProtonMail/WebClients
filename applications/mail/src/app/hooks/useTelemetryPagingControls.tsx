import { useApi } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { TelemetryMailPagingControlsEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';

export enum PaginationSources {
    toolbar = 'toolbar',
    list = 'list',
}

type TelemetryPagingControlsOptions =
    | {
          event: TelemetryMailPagingControlsEvents.move_to_previous_page;
          dimensions: { source: PaginationSources };
      }
    | {
          event: TelemetryMailPagingControlsEvents.move_to_next_page;
          dimensions: { source: PaginationSources };
      }
    | {
          event: TelemetryMailPagingControlsEvents.clicked_load_more_search_results;
          dimensions: { source: PaginationSources };
      }
    | {
          event: TelemetryMailPagingControlsEvents.move_to_custom_page;
          dimensions: { isPageConsecutive: 'true' | 'false'; source: PaginationSources };
      };

export const useTelemetryPagingControls = () => {
    const api = useApi();
    const [mailSettings] = useMailSettings();

    const sendPaginationTelemetry = (options: TelemetryPagingControlsOptions) => {
        const layout = mailSettings.ViewLayout === VIEW_LAYOUT.COLUMN ? 'column' : 'row';

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailPagingControls,
            event: options.event,
            dimensions: {
                layout,
                ...options.dimensions,
            },
            delay: false,
        });
    };

    return { sendPaginationTelemetry };
};

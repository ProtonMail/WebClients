import { TelemetryMailEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { Api } from '@proton/shared/lib/interfaces';

type Options = {
    event: TelemetryMailEvents.snooze_open_dropdown;
    dimensions: {
        snooze_open_dropdown: 'toolbar' | 'hover';
    };
};

export const sendSnoozeReport = async (api: Api, options: Options) => {
    await sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.mailSnooze,
        event: options.event,
        silence: true,
        ...('dimensions' in options ? { dimensions: options.dimensions } : {}),
    });
};

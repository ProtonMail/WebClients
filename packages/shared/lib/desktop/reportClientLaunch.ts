import { TelemetryDesktopEvents, TelemetryMeasurementGroups } from '../api/telemetry';
import { DESKTOP_PLATFORMS } from '../constants';
import { sendTelemetryReport } from '../helpers/metrics';
import type { Api } from '../interfaces';

export async function reportClientLaunch(installSource: string | null, product: 'mail' | 'pass', api: Api) {
    if (typeof installSource !== 'string') {
        return;
    }

    await sendTelemetryReport({
        api,
        event: TelemetryDesktopEvents.client_first_launch,
        measurementGroup: TelemetryMeasurementGroups.clientInstalls,
        dimensions: {
            client: DESKTOP_PLATFORMS.WINDOWS,
            product,
            install_source: installSource,
        },
        delay: false,
    });
}

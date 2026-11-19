import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';

import { Actions, countActionWithTelemetry } from './telemetry';

vi.mock('@proton/shared/lib/api/telemetry');
vi.mock('@proton/shared/lib/helpers/metrics');

describe('countActionWithTelemetry', () => {
    beforeEach(() => {
        setMetricsEnabled(true);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('countActionWithTelemetry: should send telemetry report with a count', async () => {
        await countActionWithTelemetry(Actions.AddToBookmark);
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith({
            api: expect.any(Function),
            measurementGroup: TelemetryMeasurementGroups.driveWebActions,
            event: TelemetryDriveWebFeature.actions,
            values: {
                count: 1,
            },
            dimensions: {
                name: Actions.AddToBookmark,
            },
            delay: false,
        });
    });

    it('countActionWithTelemetry: should send telemetry report with custom count', async () => {
        await countActionWithTelemetry(Actions.AddToBookmark, 15);
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith({
            api: expect.any(Function),
            measurementGroup: TelemetryMeasurementGroups.driveWebActions,
            event: TelemetryDriveWebFeature.actions,
            values: {
                count: 15,
            },
            dimensions: {
                name: Actions.AddToBookmark,
            },
            delay: false,
        });
    });
});

import { useApi } from '@proton/app-context/useApi';
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';

import {
    Actions,
    ExperimentGroup,
    Features,
    countActionWithTelemetry,
    measureExperimentalPerformance,
    measureFeaturePerformance,
} from './telemetry';

jest.mock('@proton/shared/lib/api/telemetry');
jest.mock('@proton/app-context/useApi');
jest.mock('@proton/shared/lib/helpers/metrics');

describe('Performance Telemetry', () => {
    beforeEach(() => {
        setMetricsEnabled(true);
        jest.useFakeTimers();
        window.performance.mark = jest.fn();
        window.performance.measure = jest.fn().mockImplementation(() => ({ duration: 100 }));
        window.performance.clearMarks = jest.fn();
        window.performance.clearMeasures = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('measureExperimentalPerformance: executes the control function when flag is false', async () => {
        const feature = 'testFeature' as Features;
        const flag = false;
        const controlFunction = jest.fn(() => Promise.resolve('control result'));
        const treatmentFunction = jest.fn(() => Promise.resolve('treatment result'));
        const api = useApi();

        await measureExperimentalPerformance(api, feature, flag, controlFunction, treatmentFunction);

        expect(controlFunction).toHaveBeenCalledTimes(1);
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(performance.clearMarks).toHaveBeenCalledTimes(2);
        expect(performance.clearMeasures).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith({
            api,
            measurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
            event: TelemetryDriveWebFeature.performance,
            values: {
                milliseconds: 100,
            },
            dimensions: {
                experimentGroup: ExperimentGroup.control,
                featureName: feature,
            },
            delay: false,
        });
    });

    it('measureExperimentalPerformance: executes the treatment function when flag is true', async () => {
        const feature = 'testFeature' as Features;
        const flag = true;
        const controlFunction = jest.fn(() => Promise.resolve('control result'));
        const treatmentFunction = jest.fn(() => Promise.resolve('treatment result'));
        const api = useApi();

        await measureExperimentalPerformance(api, feature, flag, controlFunction, treatmentFunction);

        expect(treatmentFunction).toHaveBeenCalledTimes(1);
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(performance.clearMarks).toHaveBeenCalledTimes(2);
        expect(performance.clearMeasures).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith({
            api,
            measurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
            event: TelemetryDriveWebFeature.performance,
            values: {
                milliseconds: 100,
            },
            dimensions: {
                experimentGroup: ExperimentGroup.treatment,
                featureName: feature,
            },
            delay: false,
        });
    });

    it('measureFeaturePerformance: measure duration between a start and end', () => {
        const api = useApi();
        const measure = measureFeaturePerformance(api, Features.mountToFirstItemRendered);
        measure.start();
        measure.end();
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(performance.clearMarks).toHaveBeenCalledTimes(2);
        expect(performance.clearMeasures).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith({
            api,
            measurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
            event: TelemetryDriveWebFeature.performance,
            values: {
                milliseconds: 100,
            },
            dimensions: {
                experimentGroup: ExperimentGroup.control,
                featureName: Features.mountToFirstItemRendered,
            },
            delay: false,
        });
    });
});

describe('countActionWithTelemetry', () => {
    beforeEach(() => {
        setMetricsEnabled(true);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('countActionWithTelemetry: should send telemetry report with a count', async () => {
        await countActionWithTelemetry(Actions.PublicDownload);
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith({
            api: expect.any(Function),
            measurementGroup: TelemetryMeasurementGroups.driveWebActions,
            event: TelemetryDriveWebFeature.actions,
            values: {
                count: 1,
            },
            dimensions: {
                name: Actions.PublicDownload,
            },
            delay: false,
        });
    });

    it('countActionWithTelemetry: should send telemetry report with custom count', async () => {
        await countActionWithTelemetry(Actions.PublicDownload, 15);
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith({
            api: expect.any(Function),
            measurementGroup: TelemetryMeasurementGroups.driveWebActions,
            event: TelemetryDriveWebFeature.actions,
            values: {
                count: 15,
            },
            dimensions: {
                name: Actions.PublicDownload,
            },
            delay: false,
        });
    });
});

import {
    TelemetryDriveWebFeature,
    TelemetryMeasurementGroups,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';

import { ExperimentGroup, Features, measureExperimentalPerformance } from './telemetry';

jest.mock('@proton/shared/lib/api/telemetry');

describe('measureExperimentalPerformance', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        window.performance.mark = jest.fn();
        window.performance.measure = jest.fn().mockImplementation(() => ({ duration: 100 }));
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('executes the control function when flag is false', () => {
        const feature = Features.optimisticFileUploads;
        const flag = false;
        const controlFunction = jest.fn(() => 'control result');
        const treatmentFunction = jest.fn(() => 'treatment result');

        measureExperimentalPerformance(feature, flag, controlFunction, treatmentFunction);

        expect(controlFunction).toHaveBeenCalledTimes(1);
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledWith({
            MeasurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
            Event: TelemetryDriveWebFeature.performance,
            Values: {
                milliseconds: 100,
            },
            Dimensions: {
                experimentGroup: ExperimentGroup.control,
                featureName: feature,
            },
        });
    });

    it('executes the treatment function when flag is true', () => {
        const feature = Features.optimisticFileUploads;
        const flag = true;
        const controlFunction = jest.fn(() => 'control result');
        const treatmentFunction = jest.fn(() => 'treatment result');

        measureExperimentalPerformance(feature, flag, controlFunction, treatmentFunction);

        expect(treatmentFunction).toHaveBeenCalledTimes(1);
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledWith({
            MeasurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
            Event: TelemetryDriveWebFeature.performance,
            Values: {
                milliseconds: 100,
            },
            Dimensions: {
                experimentGroup: ExperimentGroup.treatment,
                featureName: feature,
            },
        });
    });
});

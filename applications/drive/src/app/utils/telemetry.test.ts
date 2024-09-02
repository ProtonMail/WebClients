import { useApi } from '@proton/components/hooks';
import {
    TelemetryDriveWebFeature,
    TelemetryMeasurementGroups,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';

import {
    Actions,
    ExperimentGroup,
    Features,
    countActionWithTelemetry,
    measureExperimentalPerformance,
    measureFeaturePerformance,
} from './telemetry';

jest.mock('@proton/shared/lib/api/telemetry');
jest.mock('@proton/components/hooks/useApi');

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

        await measureExperimentalPerformance(useApi(), feature, flag, controlFunction, treatmentFunction);

        expect(controlFunction).toHaveBeenCalledTimes(1);
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(performance.clearMarks).toHaveBeenCalledTimes(2);
        expect(performance.clearMeasures).toHaveBeenCalledTimes(1);
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

    it('measureExperimentalPerformance: executes the treatment function when flag is true', async () => {
        const feature = 'testFeature' as Features;
        const flag = true;
        const controlFunction = jest.fn(() => Promise.resolve('control result'));
        const treatmentFunction = jest.fn(() => Promise.resolve('treatment result'));

        await measureExperimentalPerformance(useApi(), feature, flag, controlFunction, treatmentFunction);

        expect(treatmentFunction).toHaveBeenCalledTimes(1);
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(performance.clearMarks).toHaveBeenCalledTimes(2);
        expect(performance.clearMeasures).toHaveBeenCalledTimes(1);
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

    it('measureFeaturePerformance: measure duration between a start and end', () => {
        const measure = measureFeaturePerformance(useApi(), Features.mountToFirstItemRendered);
        measure.start();
        measure.end();
        expect(performance.mark).toHaveBeenCalledTimes(2);
        expect(performance.measure).toHaveBeenCalledTimes(1);
        expect(performance.clearMarks).toHaveBeenCalledTimes(2);
        expect(performance.clearMeasures).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledWith({
            MeasurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
            Event: TelemetryDriveWebFeature.performance,
            Values: {
                milliseconds: 100,
            },
            Dimensions: {
                experimentGroup: ExperimentGroup.control,
                featureName: Features.mountToFirstItemRendered,
            },
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

    it('countActionWithTelemetry: should send telemetry report with a count', () => {
        countActionWithTelemetry(Actions.DismissDocsOnboardingModal);
        expect(sendTelemetryData).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledWith({
            MeasurementGroup: TelemetryMeasurementGroups.driveWebActions,
            Event: TelemetryDriveWebFeature.actions,
            Values: {
                count: 1,
            },
            Dimensions: {
                name: Actions.DismissDocsOnboardingModal,
            },
        });
    });

    it('countActionWithTelemetry: should send telemetry report with custom count', () => {
        countActionWithTelemetry(Actions.DismissDocsOnboardingModal, 15);
        expect(sendTelemetryData).toHaveBeenCalledTimes(1);
        expect(sendTelemetryData).toHaveBeenCalledWith({
            MeasurementGroup: TelemetryMeasurementGroups.driveWebActions,
            Event: TelemetryDriveWebFeature.actions,
            Values: {
                count: 15,
            },
            Dimensions: {
                name: Actions.DismissDocsOnboardingModal,
            },
        });
    });
});

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
    getTimeBasedHash,
    measureExperimentalPerformance,
    measureFeaturePerformance,
} from './telemetry';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from './test/crypto';

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
                isLoggedIn: 'true',
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
                isLoggedIn: 'true',
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
                isLoggedIn: 'true',
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
                isLoggedIn: 'true',
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
                isLoggedIn: 'true',
            },
        });
    });
});

describe('getTimeBasedHash', () => {
    let originalDateNow: () => number;
    const now = 1625097600000;

    beforeAll(() => {
        setupCryptoProxyForTesting();
        originalDateNow = Date.now;
    });

    afterAll(() => {
        releaseCryptoProxy();
        Date.now = originalDateNow;
    });

    beforeEach(() => {
        Date.now = jest.fn(() => now); // 2021-07-01T00:00:00.000Z
    });

    it('should return the same hash for inputs within the same interval', async () => {
        const hash1 = await getTimeBasedHash('test');
        Date.now = jest.fn(() => now + 5 * 60 * 1000); // 5 minutes later
        const hash2 = await getTimeBasedHash('test');

        expect(hash1).toBe(hash2);
    });

    it('should return different hashes for inputs in different intervals', async () => {
        const hash1 = await getTimeBasedHash('test');
        Date.now = jest.fn(() => now + 15 * 60 * 1000); // 15 minutes later
        const hash2 = await getTimeBasedHash('test');

        expect(hash1).not.toBe(hash2);
    });

    it('should return different hashes for different inputs in the same interval', async () => {
        const hash1 = await getTimeBasedHash('test1');
        const hash2 = await getTimeBasedHash('test2');

        expect(hash1).not.toBe(hash2);
    });

    it('should use the default interval of 10 minutes when not specified', async () => {
        const hash1 = await getTimeBasedHash('test');
        Date.now = jest.fn(() => now + 9 * 60 * 1000); // 9 minutes later
        const hash2 = await getTimeBasedHash('test');
        Date.now = jest.fn(() => now + 11 * 60 * 1000); // 11 minutes later
        const hash3 = await getTimeBasedHash('test');

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('should use a custom interval when specified', async () => {
        const customInterval = 5 * 60 * 1000; // 5 minutes

        const hash1 = await getTimeBasedHash('test', customInterval);
        Date.now = jest.fn(() => now + 4 * 60 * 1000); // 4 minutes later
        const hash2 = await getTimeBasedHash('test', customInterval);
        Date.now = jest.fn(() => now + 6 * 60 * 1000); // 6 minutes later
        const hash3 = await getTimeBasedHash('test', customInterval);

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('should handle edge cases around interval boundaries', async () => {
        const hash1 = await getTimeBasedHash('test');
        Date.now = jest.fn(() => now + 10 * 60 * 1000 - 1); // 1ms before next interval
        const hash2 = await getTimeBasedHash('test');
        Date.now = jest.fn(() => now + 10 * 60 * 1000); // Exactly at next interval
        const hash3 = await getTimeBasedHash('test');

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('should produce a hex string of correct length', async () => {
        const hash = await getTimeBasedHash('test');

        expect(hash).toMatch(/^[0-9a-f]{64}$/); // 32 bytes = 64 hex characters
    });
});

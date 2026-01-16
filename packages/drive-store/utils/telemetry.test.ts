import { useApi } from '@proton/components';
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';

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

describe('getTimeBasedHash', () => {
    let originalDateNow: () => number;
    const now = 1625097600000;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        originalDateNow = Date.now;
    });

    afterAll(async () => {
        await releaseCryptoProxy();
        Date.now = originalDateNow;
    });

    beforeEach(() => {
        Date.now = jest.fn(() => now); // 2021-07-01T00:00:00.000Z
    });

    it('should return the same hash for inputs within the same interval', async () => {
        const hash1 = await getTimeBasedHash();
        Date.now = jest.fn(() => now + 5 * 60 * 1000); // 5 minutes later
        const hash2 = await getTimeBasedHash();

        expect(hash1).toBe(hash2);
    });

    it('should return different hashes for inputs in different intervals', async () => {
        const hash1 = await getTimeBasedHash();
        Date.now = jest.fn(() => now + 15 * 60 * 1000); // 15 minutes later
        const hash2 = await getTimeBasedHash();

        expect(hash1).not.toBe(hash2);
    });

    it('should use the default interval of 10 minutes when not specified', async () => {
        const hash1 = await getTimeBasedHash();
        Date.now = jest.fn(() => now + 9 * 60 * 1000); // 9 minutes later
        const hash2 = await getTimeBasedHash();
        Date.now = jest.fn(() => now + 11 * 60 * 1000); // 11 minutes later
        const hash3 = await getTimeBasedHash();

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('should use a custom interval when specified', async () => {
        const customInterval = 5 * 60 * 1000; // 5 minutes

        const hash1 = await getTimeBasedHash(customInterval);
        Date.now = jest.fn(() => now + 4 * 60 * 1000); // 4 minutes later
        const hash2 = await getTimeBasedHash(customInterval);
        Date.now = jest.fn(() => now + 6 * 60 * 1000); // 6 minutes later
        const hash3 = await getTimeBasedHash(customInterval);

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('should handle edge cases around interval boundaries', async () => {
        const hash1 = await getTimeBasedHash();
        Date.now = jest.fn(() => now + 10 * 60 * 1000 - 1); // 1ms before next interval
        const hash2 = await getTimeBasedHash();
        Date.now = jest.fn(() => now + 10 * 60 * 1000); // Exactly at next interval
        const hash3 = await getTimeBasedHash();

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('should produce a hex string of correct length', async () => {
        const hash = await getTimeBasedHash();

        expect(hash).toMatch(/^[0-9a-f]{64}$/); // 32 bytes = 64 hex characters
    });
});

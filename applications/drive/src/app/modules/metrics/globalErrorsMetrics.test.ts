import metrics from '@proton/metrics';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { GlobalErrorsMetrics } from './globalErrorsMetrics';
import { MetricUserPlan } from './types';

jest.mock('@proton/metrics', () => ({
    __esModule: true,
    default: {
        drive_error_total: {
            increment: jest.fn(),
        },
        drive_error_erroring_users_total: {
            increment: jest.fn(),
        },
    },
}));

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceError: jest.fn(),
}));

describe('GlobalErrorsMetrics', () => {
    let globalErrorsMetrics: GlobalErrorsMetrics;
    let mockUserPlanProvider: { getUserPlan: jest.Mock };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(1000000);
        jest.clearAllMocks();
        mockUserPlanProvider = { getUserPlan: jest.fn().mockReturnValue(MetricUserPlan.Unknown) };
        globalErrorsMetrics = new GlobalErrorsMetrics(mockUserPlanProvider);
        globalErrorsMetrics.init();
    });

    afterEach(() => {
        globalErrorsMetrics.destroy();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('mark methods', () => {
        test('markCoreFeatureError sends immediate metric and records for periodic report', () => {
            globalErrorsMetrics.markCoreFeatureError();

            expect(metrics.drive_error_total.increment).toHaveBeenCalledWith({ category: 'coreFeatureError' });
            expect(globalErrorsMetrics._getErrorMarks().get('coreFeatureError')).toBe(1000000);
        });

        test('markCrashError sends immediate metric and records for periodic report', () => {
            globalErrorsMetrics.markCrashError(new Error('test crash error'));

            expect(metrics.drive_error_total.increment).toHaveBeenCalledWith({ category: 'crashError' });
            expect(globalErrorsMetrics._getErrorMarks().get('crashError')).toBe(1000000);
            expect(traceError).toHaveBeenCalledWith(new Error('test crash error'), {
                tags: {
                    driveMetricEvent: 'crashError',
                },
            });
        });

        test('markOtherError sends immediate metric and records for periodic report', () => {
            globalErrorsMetrics.markOtherError();

            expect(metrics.drive_error_total.increment).toHaveBeenCalledWith({ category: 'otherError' });
            expect(globalErrorsMetrics._getErrorMarks().get('otherError')).toBe(1000000);
        });
    });

    describe('periodic reports', () => {
        test('periodic report sends aggregated metrics after 5 minutes', async () => {
            globalErrorsMetrics.markCoreFeatureError();

            jest.advanceTimersByTime(5 * 60 * 1000 - 10);
            await Promise.resolve();

            expect(metrics.drive_error_erroring_users_total.increment).not.toHaveBeenCalled();

            jest.advanceTimersByTime(10);
            await Promise.resolve();

            expect(metrics.drive_error_erroring_users_total.increment).toHaveBeenCalledWith({
                plan: MetricUserPlan.Unknown,
                coreFeatureError: 'true',
                crashError: 'false',
                otherError: 'false',
            });

            jest.advanceTimersByTime(5 * 60 * 1000);
            await Promise.resolve();

            expect(metrics.drive_error_erroring_users_total.increment).toHaveBeenCalledWith({
                plan: MetricUserPlan.Unknown,
                coreFeatureError: 'false',
                crashError: 'false',
                otherError: 'false',
            });
        });

        test('uses plan from userPlanProvider for periodic reports', async () => {
            mockUserPlanProvider.getUserPlan.mockReturnValue(MetricUserPlan.Paid);
            globalErrorsMetrics.markCrashError(new Error('test crash error'));

            jest.advanceTimersByTime(5 * 60 * 1000);
            await Promise.resolve();

            expect(metrics.drive_error_erroring_users_total.increment).toHaveBeenCalledWith(
                expect.objectContaining({ plan: MetricUserPlan.Paid })
            );
        });
    });
});

import metrics from '@proton/metrics';

import { UserAvailabilityTypes } from '../types/userSuccessMetricsTypes';
import { MetricSharedWorker } from './shared-metrics.worker';

jest.mock('@proton/metrics', () => ({
    setVersionHeaders: jest.fn(),
    setAuthHeaders: jest.fn(),
    drive_users_success_rate_total: {
        increment: jest.fn(),
    },
    processAllRequests: jest.fn(),
    clearAuthHeaders: jest.fn(),
}));

jest.useFakeTimers();

describe('MetricSharedWorker', () => {
    let worker: MetricSharedWorker;
    let originalDateNow: () => number;

    beforeEach(() => {
        worker = new MetricSharedWorker();
        originalDateNow = Date.now;
        Date.now = jest.fn(() => 1000000);
    });

    afterEach(() => {
        jest.resetAllMocks();
        Date.now = originalDateNow;
    });

    test('report should be called after 5 minutes', async () => {
        worker.init();

        const connectionId = 'test-connection';
        worker.setAuthHeaders(connectionId, 'test-uid', 'test-token');
        worker.setVersionHeaders(connectionId, 'test-client', '1.0.0');
        worker.setLocalUser(connectionId, 'test-uid', 'paid');
        worker.mark(connectionId, UserAvailabilityTypes.coreFeatureError);

        const expectedUser = worker._getUsers().get(connectionId);
        const reportSpy = jest.spyOn(worker, 'report').mockResolvedValue(undefined);

        jest.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();

        expect(reportSpy).toHaveBeenCalled();
        expect(reportSpy).toHaveBeenCalledWith([
            {
                user: expectedUser,
                mark: {
                    plan: 'paid',
                    [UserAvailabilityTypes.coreFeatureError]: 'true',
                    [UserAvailabilityTypes.recoveredError]: 'false',
                    [UserAvailabilityTypes.handledError]: 'false',
                    [UserAvailabilityTypes.unhandledError]: 'false',
                },
            },
        ]);
    });

    test('mark() should update status for a connection', () => {
        const connectionId = 'test-connection';
        worker.mark(connectionId, UserAvailabilityTypes.coreFeatureError);
        expect(worker._getStatus().get(connectionId)?.get(UserAvailabilityTypes.coreFeatureError)).toBe(1000000);
    });

    test('setAuthHeaders() should update user information', () => {
        const connectionId = 'test-connection';
        const uid = 'test-uid';
        const accessToken = 'test-token';

        worker.setAuthHeaders(connectionId, uid, accessToken);

        const userInfo = worker._getUsers().get(connectionId);
        expect(userInfo?.get('uid')).toBe(uid);
        expect(userInfo?.get('accessToken')).toBe(accessToken);
    });

    test('setVersionHeaders() should update user information', () => {
        const connectionId = 'test-connection';
        const clientID = 'test-client';
        const appVersion = '1.0.0';

        worker.setVersionHeaders(connectionId, clientID, appVersion);

        const userInfo = worker._getUsers().get(connectionId);
        expect(userInfo?.get('clientID')).toBe(clientID);
        expect(userInfo?.get('appVersion')).toBe(appVersion);
    });

    test('setLocalUser() should update user information', () => {
        const connectionId = 'test-connection';
        const uid = 'test-uid';
        const plan = 'paid';

        worker.setLocalUser(connectionId, uid, plan);

        const userInfo = worker._getUsers().get(connectionId);
        expect(userInfo?.get('uid')).toBe(uid);
        expect(userInfo?.get('plan')).toBe(plan);
    });

    test('disconnect() should remove user information', () => {
        const connectionId = 'test-connection';
        worker.setLocalUser(connectionId, 'test-uid', 'paid');
        worker.disconnect(connectionId);

        expect(worker._getUsers().has(connectionId)).toBeFalsy();
    });

    test('report() should call metrics functions with correct data', async () => {
        const connectionId = 'test-connection';
        worker.setAuthHeaders(connectionId, 'test-uid', 'test-token');
        worker.setVersionHeaders(connectionId, 'test-client', '1.0.0');
        worker.setLocalUser(connectionId, 'test-uid', 'paid');
        worker.mark(connectionId, UserAvailabilityTypes.coreFeatureError);

        const user = worker._getUsers().get(connectionId);
        if (user) {
            await worker.report([
                {
                    user,
                    mark: {
                        plan: 'paid',
                        [UserAvailabilityTypes.coreFeatureError]: 'true',
                        [UserAvailabilityTypes.recoveredError]: 'false',
                        [UserAvailabilityTypes.handledError]: 'false',
                        [UserAvailabilityTypes.unhandledError]: 'false',
                    },
                },
            ]);
        }

        expect(metrics.setVersionHeaders).toHaveBeenCalledWith('test-client', '1.0.0');
        expect(metrics.setAuthHeaders).toHaveBeenCalledWith('test-uid', 'test-token');
        expect(metrics.drive_users_success_rate_total.increment).toHaveBeenCalledWith({
            plan: 'paid',
            [UserAvailabilityTypes.coreFeatureError]: 'true',
            [UserAvailabilityTypes.recoveredError]: 'false',
            [UserAvailabilityTypes.handledError]: 'false',
            [UserAvailabilityTypes.unhandledError]: 'false',
        });
        expect(metrics.processAllRequests).toHaveBeenCalled();
        expect(metrics.clearAuthHeaders).toHaveBeenCalled();
    });

    test('reports() should call report() with the metrics & correct data when special cases with same user in multiple connections', async () => {
        // user in private app
        const connectionId = 'test-connection';
        worker.setAuthHeaders(connectionId, 'test-uid', 'test-token');
        worker.setVersionHeaders(connectionId, 'test-client', '1.0.0');
        worker.setLocalUser(connectionId, 'test-uid', 'free');
        worker.mark(connectionId, UserAvailabilityTypes.coreFeatureError);

        // same user (uid) in public app (error marked)
        const connectionIdPublic = 'test-connection-public';
        worker.setAuthHeaders(connectionIdPublic, 'test-uid', 'test-token');
        worker.setVersionHeaders(connectionIdPublic, 'test-client', '1.0.0');
        worker.setLocalUser(connectionIdPublic, 'test-uid', 'unknown');
        worker.mark(connectionIdPublic, UserAvailabilityTypes.handledError);

        // same user (uid) in public app (no error)
        const connectionIdPublicAgain = 'test-connection-public-again';
        worker.setAuthHeaders(connectionIdPublicAgain, 'test-uid');
        worker.setVersionHeaders(connectionIdPublicAgain, 'test-client', '1.0.0');
        worker.setLocalUser(connectionIdPublicAgain, 'test-uid', 'unknown');

        await worker.reports();

        expect(metrics.setVersionHeaders).toHaveBeenCalledWith('test-client', '1.0.0');
        expect(metrics.setAuthHeaders).toHaveBeenCalledWith('test-uid', 'test-token');
        // one single call for one user
        expect(metrics.drive_users_success_rate_total.increment).toHaveBeenCalledTimes(1);
        expect(metrics.drive_users_success_rate_total.increment).toHaveBeenCalledWith({
            plan: 'free',
            [UserAvailabilityTypes.coreFeatureError]: 'true',
            [UserAvailabilityTypes.recoveredError]: 'false',
            [UserAvailabilityTypes.handledError]: 'true',
            [UserAvailabilityTypes.unhandledError]: 'false',
        });
        expect(metrics.processAllRequests).toHaveBeenCalled();
        expect(metrics.clearAuthHeaders).toHaveBeenCalled();
    });
});

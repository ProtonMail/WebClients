import MetricsApi from '../lib/MetricsApi';
import MetricsBase from '../lib/MetricsBase';
import MetricsRequestService from '../lib/MetricsRequestService';

jest.mock('../lib/MetricsApi');
const metricsApi = new MetricsApi();

jest.mock('../lib/MetricsRequestService', () => {
    return jest.fn().mockImplementation(() => {
        return {
            api: metricsApi,
            setReportMetrics: jest.fn(),
            processAllRequests: jest.fn(),
            stopBatchingProcess: jest.fn(),
            startBatchingProcess: jest.fn(),
        };
    });
});

const metricsRequestService = new MetricsRequestService(metricsApi, { reportMetrics: true });

describe('MetricsBase', () => {
    describe('init', () => {
        it('sets auth headers', () => {
            const uid = 'uid';

            const clientID = 'clientID';
            const appVersion = 'appVersion';
            const metrics = new MetricsBase(metricsRequestService);

            metrics.init({ uid, clientID, appVersion });

            expect(metricsRequestService.api.setAuthHeaders).toHaveBeenCalledWith(uid, undefined);
        });

        it('sets version headers', () => {
            const uid = 'uid';
            const clientID = 'clientID';
            const appVersion = 'appVersion';
            const metrics = new MetricsBase(metricsRequestService);

            metrics.init({ uid, clientID, appVersion });

            expect(metricsRequestService.api.setVersionHeaders).toHaveBeenCalledWith(clientID, appVersion);
        });
    });

    describe('setVersionHeaders', () => {
        it('sets version headers', () => {
            const clientID = 'clientID';
            const appVersion = 'appVersion';
            const metrics = new MetricsBase(metricsRequestService);

            metrics.setVersionHeaders(clientID, appVersion);

            expect(metricsRequestService.api.setVersionHeaders).toHaveBeenCalledWith(clientID, appVersion);
        });
    });

    describe('setAuthHeaders', () => {
        it('sets auth headers', () => {
            const uid = 'uid';
            const metrics = new MetricsBase(metricsRequestService);

            metrics.setAuthHeaders(uid);

            expect(metricsRequestService.api.setAuthHeaders).toHaveBeenCalledWith(uid, undefined);
        });

        it('sets auth headers and authorization', () => {
            const uid = 'uid';
            const accessToken = 'accessToken';
            const metrics = new MetricsBase(metricsRequestService);

            metrics.setAuthHeaders(uid, accessToken);

            expect(metricsRequestService.api.setAuthHeaders).toHaveBeenCalledWith(uid, accessToken);
        });
    });

    describe('clearAuthHeaders', () => {
        it(`sets auth headers with uid ''`, () => {
            const metrics = new MetricsBase(metricsRequestService);

            metrics.clearAuthHeaders();

            expect(metricsRequestService.api.setAuthHeaders).toHaveBeenCalledWith('');
        });
    });

    describe('setReportMetrics', () => {
        it('sets report metrics to false', () => {
            const metrics = new MetricsBase(metricsRequestService);

            metrics.setReportMetrics(false);

            expect(metricsRequestService.setReportMetrics).toHaveBeenCalledWith(false);
        });

        it('sets report metrics to true', () => {
            const metrics = new MetricsBase(metricsRequestService);

            metrics.setReportMetrics(true);

            expect(metricsRequestService.setReportMetrics).toHaveBeenCalledWith(true);
        });
    });

    describe('processAllRequests', () => {
        it('calls processAllRequests', async () => {
            const metrics = new MetricsBase(metricsRequestService);

            await metrics.processAllRequests();

            expect(metricsRequestService.processAllRequests).toHaveBeenCalledTimes(1);
        });
    });

    describe('stopBatchingProcess', () => {
        it('calls stopBatchingProcess', async () => {
            const metrics = new MetricsBase(metricsRequestService);

            await metrics.stopBatchingProcess();

            expect(metricsRequestService.stopBatchingProcess).toHaveBeenCalledTimes(1);
        });
    });

    describe('startBatchingProcess', () => {
        it('calls startBatchingProcess', async () => {
            const metrics = new MetricsBase(metricsRequestService);

            await metrics.startBatchingProcess();

            expect(metricsRequestService.startBatchingProcess).toHaveBeenCalledTimes(1);
        });
    });
});

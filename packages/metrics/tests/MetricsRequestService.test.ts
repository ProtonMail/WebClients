import MetricsApi from '../lib/MetricsApi';
import MetricsRequestService from '../lib/MetricsRequestService';
import type MetricsRequest from '../lib/types/MetricsRequest';

jest.mock('../lib/MetricsApi');
const metricsApi = new MetricsApi();

const getMetricsRequest = (name: string): MetricsRequest => ({
    Name: name,
    Version: 1,
    Timestamp: 1,
    Data: {},
});

const defaultMetricsRequest = getMetricsRequest('Name');

describe('MetricsRequestService', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        jest.clearAllTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('makes construct correct request', () => {
        const requestService = new MetricsRequestService(metricsApi, { reportMetrics: true });

        requestService.report(defaultMetricsRequest);

        expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
            method: 'post',
            body: JSON.stringify({ Metrics: [defaultMetricsRequest] }),
        });
    });

    describe('report metrics', () => {
        it('allows api calls if reportMetrics was set to true in constructor', () => {
            const requestService = new MetricsRequestService(metricsApi, { reportMetrics: true });

            requestService.report(defaultMetricsRequest);

            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        });

        it('disallows api calls if reportMetrics was set to false in constructor', () => {
            const requestService = new MetricsRequestService(metricsApi, { reportMetrics: false });

            requestService.report(defaultMetricsRequest);

            expect(metricsApi.fetch).not.toHaveBeenCalled();
        });

        describe('setter', () => {
            it('allows api calls if reportMetrics is set to true via setter', () => {
                const requestService = new MetricsRequestService(metricsApi, { reportMetrics: false });

                requestService.setReportMetrics(true);
                requestService.report(defaultMetricsRequest);

                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            });

            it('disallows api calls if reportMetrics is set to false via setter', () => {
                const requestService = new MetricsRequestService(metricsApi, { reportMetrics: true });

                requestService.setReportMetrics(false);
                requestService.report(defaultMetricsRequest);

                expect(metricsApi.fetch).not.toHaveBeenCalled();
            });
        });
    });

    describe('batching', () => {
        describe('batch parameters', () => {
            it('does not batch if frequency is 0', () => {
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: 0,
                        size: 1,
                    },
                });

                requestService.report(defaultMetricsRequest);

                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            });

            it('does not batch if frequency is negative', () => {
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: -1,
                        size: 1,
                    },
                });

                requestService.report(defaultMetricsRequest);

                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            });

            it('does not batch if size is 0', () => {
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: 1,
                        size: 0,
                    },
                });

                requestService.report(defaultMetricsRequest);

                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            });

            it('does not batch if size is negative', () => {
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: 1,
                        size: -1,
                    },
                });

                requestService.report(defaultMetricsRequest);

                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            });

            it('batches if frequency and size are positive', () => {
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: 1,
                        size: 1,
                    },
                });

                requestService.report(getMetricsRequest('Request 1'));
                requestService.report(getMetricsRequest('Request 2'));
                expect(metricsApi.fetch).not.toHaveBeenCalled();

                jest.advanceTimersByTime(1);
                expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                    method: 'post',
                    body: JSON.stringify({ Metrics: [getMetricsRequest('Request 1')] }),
                });

                jest.advanceTimersByTime(1);
                expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                    method: 'post',
                    body: JSON.stringify({ Metrics: [getMetricsRequest('Request 2')] }),
                });
            });
        });

        describe('jails', () => {
            it('defaults jailMax to 3', async () => {
                metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());
                const batchFrequency = 100;
                const batchSize = 1;
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: batchFrequency,
                        size: batchSize,
                    },
                });

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);

                await jest.advanceTimersToNextTimerAsync();
                await jest.advanceTimersToNextTimerAsync();
                await jest.advanceTimersToNextTimerAsync();
                await jest.advanceTimersToNextTimerAsync();

                expect(metricsApi.fetch).toHaveBeenCalledTimes(3);
            });

            it('sets jailMax to value passed in constructor', async () => {
                metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());
                const batchFrequency = 1;
                const batchSize = 2;
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: batchFrequency,
                        size: batchSize,
                    },
                    jailMax: 1,
                });

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);

                await jest.advanceTimersToNextTimerAsync();
                await jest.advanceTimersToNextTimerAsync();

                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            });

            it('resets jails if successful call is made and queue is clear', async () => {
                metricsApi.fetch = jest
                    .fn()
                    .mockRejectedValueOnce(undefined)
                    // Resolve second request
                    .mockResolvedValueOnce(undefined)
                    //
                    .mockRejectedValueOnce(undefined)
                    .mockRejectedValueOnce(undefined)
                    .mockRejectedValueOnce(undefined);

                const batchFrequency = 1;
                const batchSize = 2;
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: batchFrequency,
                        size: batchSize,
                    },
                    jailMax: 2,
                });

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                // Will clear queue no items left in queue so jails will reset
                await jest.advanceTimersToNextTimerAsync();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                await jest.advanceTimersToNextTimerAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(2);

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                await jest.advanceTimersToNextTimerAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(3);

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                await jest.advanceTimersToNextTimerAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(4);

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                await jest.advanceTimersToNextTimerAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(4);
            });

            it('does not reset jails if there are items still in the queue', async () => {
                metricsApi.fetch = jest
                    .fn()
                    .mockRejectedValueOnce(undefined)
                    // Resolve second request
                    .mockResolvedValueOnce(undefined)
                    //
                    .mockRejectedValueOnce(undefined)
                    .mockRejectedValueOnce(undefined);

                const batchFrequency = 1;
                const batchSize = 2;
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: batchFrequency,
                        size: batchSize,
                    },
                    jailMax: 2,
                });

                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);
                requestService.report(defaultMetricsRequest);

                await jest.advanceTimersToNextTimerAsync();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

                await jest.advanceTimersToNextTimerAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(2);

                await jest.advanceTimersToNextTimerAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(3);

                await jest.advanceTimersToNextTimerAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(3);
            });
        });

        it('delays api calls until frequency timeout has expired', () => {
            const batchFrequency = 100;
            const batchSize = 5;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: batchSize,
                },
            });

            requestService.report(defaultMetricsRequest);
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            // fast-forward time until 1 millisecond before it should be executed
            jest.advanceTimersByTime(batchFrequency - 1);
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            // fast-forward until 1st call should be executed
            jest.advanceTimersByTime(1);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        });

        it('does not call api if there are no items to process', () => {
            const batchFrequency = 100;
            const batchSize = 5;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: batchSize,
                },
            });
            requestService.startBatchingProcess();

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).not.toHaveBeenCalled();
        });

        it('pauses batching if there are no items to process', async () => {
            const batchFrequency = 100;
            const batchSize = 1;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: batchSize,
                },
            });
            requestService.stopBatchingProcess = jest.fn();

            requestService.report(defaultMetricsRequest);
            requestService.report(defaultMetricsRequest);

            await jest.advanceTimersToNextTimerAsync();
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            expect(requestService.stopBatchingProcess).toHaveBeenCalledTimes(0);

            await jest.advanceTimersToNextTimerAsync();
            expect(metricsApi.fetch).toHaveBeenCalledTimes(2);

            // Queue is empty, so we should stop batching
            await jest.advanceTimersToNextTimerAsync();
            expect(requestService.stopBatchingProcess).toHaveBeenCalledTimes(1);
        });

        it('batches calls in order they were reported', () => {
            const batchFrequency = 100;
            const batchSize = 2;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: batchSize,
                },
            });

            requestService.report(getMetricsRequest('Request 1'));
            requestService.report(getMetricsRequest('Request 2'));
            requestService.report(getMetricsRequest('Request 3'));
            requestService.report(getMetricsRequest('Request 4'));
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                method: 'post',
                body: JSON.stringify({ Metrics: [getMetricsRequest('Request 1'), getMetricsRequest('Request 2')] }),
            });

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                method: 'post',
                body: JSON.stringify({ Metrics: [getMetricsRequest('Request 3'), getMetricsRequest('Request 4')] }),
            });
        });

        it('handles partial batches', () => {
            const batchFrequency = 100;
            const batchSize = 2;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: batchSize,
                },
            });

            requestService.report(getMetricsRequest('Request 1'));
            requestService.report(getMetricsRequest('Request 2'));
            requestService.report(getMetricsRequest('Request 3'));
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                method: 'post',
                body: JSON.stringify({ Metrics: [getMetricsRequest('Request 1'), getMetricsRequest('Request 2')] }),
            });

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                method: 'post',
                body: JSON.stringify({ Metrics: [getMetricsRequest('Request 3')] }),
            });
        });

        describe('progressive backoff', () => {
            it('progressively backs off by a factor of the jail count if requests fail', async () => {
                metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());
                const batchFrequency = 1;
                const batchSize = 2;
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: batchFrequency,
                        size: batchSize,
                    },
                    jailMax: 4,
                });

                requestService.report(getMetricsRequest('Request 1'));
                requestService.report(getMetricsRequest('Request 2'));
                requestService.report(getMetricsRequest('Request 3'));
                requestService.report(getMetricsRequest('Request 4'));
                requestService.report(getMetricsRequest('Request 5'));
                requestService.report(getMetricsRequest('Request 6'));

                expect(metricsApi.fetch).not.toHaveBeenCalled();

                await jest.advanceTimersByTimeAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
                expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                    method: 'post',
                    body: JSON.stringify({ Metrics: [getMetricsRequest('Request 1'), getMetricsRequest('Request 2')] }),
                });

                // Requests will have failed, so should now take 2 times the batch frequency
                await jest.advanceTimersByTimeAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

                await jest.advanceTimersByTimeAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(2);
                expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                    method: 'post',
                    body: JSON.stringify({ Metrics: [getMetricsRequest('Request 3'), getMetricsRequest('Request 4')] }),
                });

                // Failed again, so should now take 3 times the batch frequency
                await jest.advanceTimersByTimeAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(2);
                await jest.advanceTimersByTimeAsync(batchFrequency);
                expect(metricsApi.fetch).toHaveBeenCalledTimes(2);
                await jest.advanceTimersByTimeAsync(batchFrequency);

                expect(metricsApi.fetch).toHaveBeenCalledTimes(3);
                expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                    method: 'post',
                    body: JSON.stringify({ Metrics: [getMetricsRequest('Request 3'), getMetricsRequest('Request 4')] }),
                });
            });
        });
    });

    describe('startBatchingProcess', () => {
        it('starts batching interval on first report call if batch params are defined', () => {
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: 1,
                    size: 1,
                },
            });

            requestService.report(defaultMetricsRequest);
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        });

        it('does not set batching interval if no batch params are set', () => {
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
            });

            requestService.report(defaultMetricsRequest);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

            /**
             * Advance timers to when call should have been
             * performed if batching was enabled and ensure
             * no extra calls have been made
             */
            jest.advanceTimersByTime(1);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('stopBatchingProcess', () => {
        it('stops any further batch requests from occurring until startBatchingProcess is called', () => {
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: 1,
                    size: 1,
                },
            });

            requestService.report(defaultMetricsRequest);
            requestService.report(defaultMetricsRequest);
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

            requestService.stopBatchingProcess();

            jest.advanceTimersByTime(4);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

            requestService.startBatchingProcess();

            jest.advanceTimersByTime(1);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('processAllRequests', () => {
        it('does not make a request if there is no queue', async () => {
            const batchFrequency = 10;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: 1,
                },
            });

            await requestService.processAllRequests();
            expect(metricsApi.fetch).not.toHaveBeenCalled();
        });

        it('processes all requests in queue regardless of batch size', async () => {
            const batchFrequency = 10;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: 1,
                },
            });

            requestService.report(getMetricsRequest('Request 1'));
            requestService.report(getMetricsRequest('Request 2'));
            requestService.report(getMetricsRequest('Request 3'));
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                method: 'post',
                body: JSON.stringify({ Metrics: [getMetricsRequest('Request 1')] }),
            });

            jest.advanceTimersByTime(1);
            await requestService.processAllRequests();

            expect(metricsApi.fetch).toHaveBeenCalledTimes(2);
            expect(metricsApi.fetch).toHaveBeenCalledWith('api/data/v1/metrics', {
                method: 'post',
                body: JSON.stringify({ Metrics: [getMetricsRequest('Request 2'), getMetricsRequest('Request 3')] }),
            });
        });

        it('clears queue', async () => {
            const batchFrequency = 10;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: 1,
                },
            });

            requestService.report(getMetricsRequest('Request 1'));
            requestService.report(getMetricsRequest('Request 2'));
            requestService.report(getMetricsRequest('Request 3'));
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            await requestService.processAllRequests();
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        });

        describe('jails', () => {
            it('defaults jailMax to 3', async () => {
                metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());
                const batchFrequency = 100;
                const batchSize = 5;
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: batchFrequency,
                        size: batchSize,
                    },
                });

                requestService.report(defaultMetricsRequest);
                await requestService.processAllRequests();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

                requestService.report(defaultMetricsRequest);
                await requestService.processAllRequests();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(2);

                requestService.report(defaultMetricsRequest);
                await requestService.processAllRequests();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(3);

                requestService.report(defaultMetricsRequest);
                await requestService.processAllRequests();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(3);
            });

            it('sets jailMax to value passed in constructor', async () => {
                metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());
                const batchFrequency = 1;
                const batchSize = 5;
                const requestService = new MetricsRequestService(metricsApi, {
                    reportMetrics: true,
                    batch: {
                        frequency: batchFrequency,
                        size: batchSize,
                    },
                    jailMax: 1,
                });

                requestService.report(defaultMetricsRequest);
                await requestService.processAllRequests();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

                requestService.report(defaultMetricsRequest);
                await requestService.processAllRequests();
                expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('clearQueue', () => {
        it('removes all items from queue', () => {
            const batchFrequency = 10;
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                batch: {
                    frequency: batchFrequency,
                    size: 1,
                },
            });

            requestService.report(getMetricsRequest('Request 1'));
            requestService.report(getMetricsRequest('Request 2'));
            requestService.report(getMetricsRequest('Request 3'));
            expect(metricsApi.fetch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);

            requestService.clearQueue();

            jest.advanceTimersByTime(batchFrequency);
            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('jailMax', () => {
        it('defaults jailMax to 3', async () => {
            metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());

            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
            });

            requestService.report(getMetricsRequest('Request 1'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 2'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 3'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 4'));

            expect(metricsApi.fetch).toHaveBeenCalledTimes(3);
        });

        it('sets jailMax to value passed in constructor', async () => {
            metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());

            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                jailMax: 1,
            });

            requestService.report(getMetricsRequest('Request 1'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 2'));
            await jest.advanceTimersByTimeAsync(1);

            expect(metricsApi.fetch).toHaveBeenCalledTimes(1);
        });

        it('uses default if jailMax is 0', async () => {
            metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                jailMax: 0,
            });

            requestService.report(getMetricsRequest('Request 1'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 2'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 3'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 4'));

            expect(metricsApi.fetch).toHaveBeenCalledTimes(3);
        });

        it('uses default if jailMax is < 0', async () => {
            metricsApi.fetch = jest.fn().mockImplementation(() => Promise.reject());
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                jailMax: -1,
            });

            requestService.report(getMetricsRequest('Request 1'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 2'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 3'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 4'));

            expect(metricsApi.fetch).toHaveBeenCalledTimes(3);
        });

        it('resets jails if successful call is made', async () => {
            metricsApi.fetch = jest
                .fn()
                .mockRejectedValueOnce(undefined)
                // Resolve second request
                .mockResolvedValueOnce(undefined)
                //
                .mockRejectedValueOnce(undefined)
                .mockRejectedValueOnce(undefined)
                .mockRejectedValueOnce(undefined);
            const requestService = new MetricsRequestService(metricsApi, {
                reportMetrics: true,
                jailMax: 2,
            });

            requestService.report(getMetricsRequest('Request 1'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 2'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 3'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 4'));
            await jest.advanceTimersByTimeAsync(1);
            requestService.report(getMetricsRequest('Request 5'));
            await jest.advanceTimersByTimeAsync(1);

            expect(metricsApi.fetch).toHaveBeenCalledTimes(4);
        });
    });
});

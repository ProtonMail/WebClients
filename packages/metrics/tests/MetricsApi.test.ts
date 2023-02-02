import { SECOND } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { METRICS_DEFAULT_RETRY_SECONDS, METRICS_MAX_ATTEMPTS } from '../constants';
import MetricsApi from '../lib/MetricsApi';

jest.mock('@proton/shared/lib/helpers/promise');

function getHeader(headers: HeadersInit | undefined, headerName: string) {
    // @ts-ignore
    return headers[headerName];
}

describe('MetricsApi', () => {
    it('sets content-type header to application/json', async () => {
        const metricsApi = new MetricsApi();

        await metricsApi.fetch('/route');
        const content = fetchMock.mock.lastCall[1];

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getHeader(content?.headers, 'content-type')).toBe('application/json');
    });

    it('sets priority header to u=6', async () => {
        const metricsApi = new MetricsApi();

        await metricsApi.fetch('/route');
        const content = fetchMock.mock.lastCall[1];

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getHeader(content?.headers, 'priority')).toBe('u=6');
    });

    describe('constructor', () => {
        describe('auth headers', () => {
            it('sets auth headers when uid is defined', async () => {
                const uid = 'uid';
                const metricsApi = new MetricsApi({ uid });

                await metricsApi.fetch('/route');
                const content = fetchMock.mock.lastCall[1];

                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(getHeader(content?.headers, 'x-pm-uid')).toBe(uid);
            });

            it('does not set auth headers when uid is not defined', async () => {
                const metricsApi = new MetricsApi();

                await metricsApi.fetch('/route');
                const content = fetchMock.mock.lastCall[1];

                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(getHeader(content?.headers, 'x-pm-uid')).toBe(undefined);
            });
        });

        describe('app version headers', () => {
            it('sets app version headers when clientID and appVersion are defined', async () => {
                const clientID = 'clientID';
                const appVersion = 'appVersion';
                const metricsApi = new MetricsApi({ clientID, appVersion });

                await metricsApi.fetch('/route');
                const content = fetchMock.mock.lastCall[1];

                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(getHeader(content?.headers, 'x-pm-appversion')).toBe(`${clientID}@${appVersion}-dev`);
            });

            it('does not set app version headers when clientID is not defined', async () => {
                const appVersion = 'appVersion';
                const metricsApi = new MetricsApi({ appVersion });

                await metricsApi.fetch('/route');
                const content = fetchMock.mock.lastCall[1];

                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(getHeader(content?.headers, 'x-pm-appversion')).toBe(undefined);
            });

            it('does not set app version headers when appVersion is not defined', async () => {
                const clientID = 'clientID';
                const metricsApi = new MetricsApi({ clientID });

                await metricsApi.fetch('/route');
                const content = fetchMock.mock.lastCall[1];

                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(getHeader(content?.headers, 'x-pm-appversion')).toBe(undefined);
            });
        });
    });

    describe('setAuthHeaders', () => {
        it('sets auth headers when uid is defined', async () => {
            const uid = 'uid';
            const metricsApi = new MetricsApi();

            metricsApi.setAuthHeaders(uid);

            await metricsApi.fetch('/route');
            const content = fetchMock.mock.lastCall[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(getHeader(content?.headers, 'x-pm-uid')).toBe(uid);
        });

        it('does not set auth headers when uid is an empty string', async () => {
            const uid = '';
            const metricsApi = new MetricsApi();

            metricsApi.setAuthHeaders(uid);

            await metricsApi.fetch('/route');
            const content = fetchMock.mock.lastCall[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(getHeader(content?.headers, 'x-pm-uid')).toBe(undefined);
        });
    });

    describe('setAuthHeaders', () => {
        it('sets app version headers when clientID and appVersion are defined', async () => {
            const clientID = 'clientID';
            const appVersion = 'appVersion';
            const metricsApi = new MetricsApi();

            metricsApi.setVersionHeaders(clientID, appVersion);

            await metricsApi.fetch('/route');
            const content = fetchMock.mock.lastCall[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(getHeader(content?.headers, 'x-pm-appversion')).toBe(`${clientID}@${appVersion}-dev`);
        });

        it('does not set app version headers when clientID is an empty string', async () => {
            const clientID = '';
            const appVersion = 'appVersion';
            const metricsApi = new MetricsApi();

            metricsApi.setVersionHeaders(clientID, appVersion);

            await metricsApi.fetch('/route');
            const content = fetchMock.mock.lastCall[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(getHeader(content?.headers, 'x-pm-appversion')).toBe(undefined);
        });

        it('does not set app version headers when appVersion is an empty string', async () => {
            const clientID = 'clientID';
            const appVersion = '';
            const metricsApi = new MetricsApi();

            metricsApi.setVersionHeaders(clientID, appVersion);

            await metricsApi.fetch('/route');
            const content = fetchMock.mock.lastCall[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(getHeader(content?.headers, 'x-pm-appversion')).toBe(undefined);
        });
    });

    describe('fetch', () => {
        it('forwards request info', async () => {
            const route = '/route';
            const metricsApi = new MetricsApi();

            await metricsApi.fetch(route);
            const url = fetchMock.mock.lastCall[0];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(url).toBe(route);
        });

        it('forwards request init params', async () => {
            const method = 'post';
            const body = 'body';
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/route', {
                method,
                body,
                headers: {
                    foo: 'bar',
                },
            });
            const content = fetchMock.mock.lastCall[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(content?.method).toBe(method);
            expect(content?.body).toBe(body);
            expect(getHeader(content?.headers, 'foo')).toBe('bar');
        });
    });

    describe('retry', () => {
        const getRetryImplementation = (url: string, retrySeconds: string) => async (req: Request) => {
            if (req.url === url) {
                return {
                    status: 429,
                    headers: {
                        'retry-after': retrySeconds,
                    },
                };
            }

            return '';
        };

        it('retries request if response contains retry-after header', async () => {
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', '1'));
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/retry');

            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('respects the time the retry header contains', async () => {
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', '1'));
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', '2'));
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', '3'));
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/retry');

            expect(wait).toHaveBeenNthCalledWith(1, 1 * SECOND);
            expect(wait).toHaveBeenNthCalledWith(2, 2 * SECOND);
            expect(wait).toHaveBeenNthCalledWith(3, 3 * SECOND);
        });

        it(`only retires a maximum of ${METRICS_MAX_ATTEMPTS} times`, async () => {
            fetchMock.mockResponse(getRetryImplementation('/retry', '1'));
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/retry');

            expect(fetchMock).toHaveBeenCalledTimes(METRICS_MAX_ATTEMPTS);
        });

        it(`uses default retry of ${METRICS_DEFAULT_RETRY_SECONDS} if retry is 0`, async () => {
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', '0'));
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/retry');

            expect(wait).toHaveBeenCalledWith(METRICS_DEFAULT_RETRY_SECONDS * SECOND);
        });

        it(`uses default retry of ${METRICS_DEFAULT_RETRY_SECONDS} if retry is NaN`, async () => {
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', 'hello'));
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/retry');

            expect(wait).toHaveBeenCalledWith(METRICS_DEFAULT_RETRY_SECONDS * SECOND);
        });

        it(`uses default retry of ${METRICS_DEFAULT_RETRY_SECONDS} if retry is negative`, async () => {
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', '-1'));
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/retry');

            expect(wait).toHaveBeenCalledWith(METRICS_DEFAULT_RETRY_SECONDS * SECOND);
        });

        it('floors non integer values', async () => {
            fetchMock.mockResponseOnce(getRetryImplementation('/retry', '2.5'));
            const metricsApi = new MetricsApi();

            await metricsApi.fetch('/retry');

            expect(wait).toHaveBeenCalledWith(2 * SECOND);
        });
    });
});

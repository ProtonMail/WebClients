import MetricsApi from '../lib/MetricsApi';

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
});

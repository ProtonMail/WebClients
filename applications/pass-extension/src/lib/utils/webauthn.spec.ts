import { sendSafariMessage as sendSafari } from 'proton-pass-extension/lib/utils/safari';

import { webauthnFetcher } from './webauthn';

jest.mock('proton-pass-extension/lib/utils/safari');

const setBuildTarget = (value: string) => ((global as any).BUILD_TARGET = value);
const sendSafariMessage = sendSafari as jest.MockedFn<typeof sendSafari>;

const WELL_KNOWN = 'https://sub.proton.test/.well-known/webauthn';
const ORIGINS = ['https://www.proton.test', 'https://proton.test'];
const FETCH_OPTIONS = { credentials: 'omit', referrerPolicy: 'no-referrer' };

const fetchResponse = (url: string, json: unknown, status = 200) =>
    ({ ok: status === 200, status, url, json: async () => json }) as unknown as Response;

const badJson = async () => {
    throw new SyntaxError('Unexpected token');
};

const nativeResponse = (body: unknown, finalUrl = WELL_KNOWN, status = 200) =>
    JSON.stringify({
        status,
        finalUrl,
        body: JSON.stringify(body),
    });

describe('webauthnFetcher', () => {
    let fetchSpy: jest.SpyInstance;

    beforeAll(() => {
        fetchSpy = jest.spyOn(globalThis, 'fetch');
    });

    afterAll(() => fetchSpy.mockRestore());

    beforeEach(() => {
        fetchSpy.mockReset();
        sendSafariMessage.mockReset();
        setBuildTarget('test');
    });

    describe('browser path (`browserWebauthnFetcher`)', () => {
        test('returns `origins` and `finalUrl` from a 2xx JSON response', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins: ORIGINS }));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: ORIGINS, finalUrl: WELL_KNOWN });
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
            expect(sendSafariMessage).not.toHaveBeenCalled();
        });

        test('returns empty origins on a non-2xx response', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, {}, 400));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('returns empty origins when the body is malformed', async () => {
            fetchSpy.mockResolvedValueOnce({ ok: true, url: WELL_KNOWN, json: badJson } as unknown as Response);
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('returns empty origins when `origins` is not an array', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins: 'nope' }));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('returns empty origins on network failure', async () => {
            fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('forwards the post-redirect `res.url` as finalUrl', async () => {
            const redirected = 'https://sub.proton.test/.well-known/webauthn?redirected';
            fetchSpy.mockResolvedValueOnce(fetchResponse(redirected, { origins: ORIGINS }));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: ORIGINS, finalUrl: redirected });
        });
    });

    describe('native path (`nativeWebauthnFetcher`)', () => {
        beforeEach(() => setBuildTarget('safari'));

        test('routes through the native host and returns origins and finalUrl', async () => {
            sendSafariMessage.mockResolvedValue(nativeResponse({ origins: ORIGINS }));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: ORIGINS, finalUrl: WELL_KNOWN });
            expect(sendSafariMessage).toHaveBeenCalledWith({ fetchRelatedOrigins: { url: WELL_KNOWN } });
            expect(fetchSpy).not.toHaveBeenCalled();
        });

        test('returns empty origins when the native host reports an error', async () => {
            sendSafariMessage.mockResolvedValue(JSON.stringify({ error: 'bad request' }));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('returns empty origins on a non-2xx native responses', async () => {
            sendSafariMessage.mockResolvedValue(nativeResponse({ origins: ORIGINS }, WELL_KNOWN, 404));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('returns empty origins when the bridge yields no response', async () => {
            sendSafariMessage.mockResolvedValue(undefined);
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('returns empty origins when the native body is not usable JSON', async () => {
            sendSafariMessage.mockResolvedValue(JSON.stringify({ status: 200, finalUrl: WELL_KNOWN, body: '!' }));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });

        test('returns empty origins when native `origins` is not an array', async () => {
            sendSafariMessage.mockResolvedValue(nativeResponse({ origins: 'nope' }));
            await expect(webauthnFetcher(WELL_KNOWN)).resolves.toEqual({ origins: [] });
        });
    });
});

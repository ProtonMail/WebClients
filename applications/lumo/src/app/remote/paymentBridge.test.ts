import './paymentBridge';

const UID = 'test-uid';

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16) ProtonLumo/2.1.0-gms (Android 16; Google sdk_gphone64_arm64)';
const ANDROID_NO_GMS_UA = 'Mozilla/5.0 (Linux; Android 16) ProtonLumo/2.1.0-noGms (Android 16; Fairphone 5)';
const IOS_UA = 'Mozilla/5.0 (iPhone) ProtonLumo/2.1.0 (iOS/26.0.1; iPhone 17)';
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

const setUserAgent = (userAgent: string) => {
    Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true });
};

// parseJsonBody only reads `status` and `text()`, so a minimal stub is enough and keeps the
// tests independent of the jsdom Response implementation.
const mockResponse = (status: number, text: string) => ({ status, text: async () => text }) as unknown as Response;

const getApi = () => (window as any).paymentApiInstance;

const lastFetchCall = () => {
    const fetchMock = global.fetch as jest.Mock;
    return fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
};

describe('paymentApiInstance.apiRequest', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        setUserAgent(ANDROID_UA);
        getApi().setUid(UID);
    });

    it('resolves 200 with the parsed body', async () => {
        const plans = { Code: 1000, Plans: [{ Name: 'lumo2024' }] };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(200, JSON.stringify(plans)));

        const result = await getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/plans', body: null });

        expect(result).toEqual({ Status: 200, Body: plans });
    });

    it('prefixes the endpoint with /api and sends the session UID', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(200, '{}'));

        await getApi().apiRequest({ method: 'GET', endpoint: '/payments/v6/status/google', body: null });

        const [url, init] = lastFetchCall();
        expect(url).toBe('/api/payments/v6/status/google');
        expect(init.method).toBe('GET');
        expect((init.headers as Record<string, string>)['x-pm-uid']).toBe(UID);
    });

    it('sends the body byte-identical to the string it was given', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(200, '{"Code":1000,"Token":"abc"}'));
        const body = '{"Amount":499,"Currency":"CHF","Payment":{"InAppGooglePayload":{"orderID":"GPA.1"}}}';

        const result = await getApi().apiRequest({ method: 'POST', endpoint: '/payments/v5/tokens', body });

        const [, init] = lastFetchCall();
        expect(init.body).toBe(body);
        expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
        expect(result).toEqual({ Status: 200, Body: { Code: 1000, Token: 'abc' } });
    });

    it('omits the body for GET', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(200, '{}'));

        await getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/subscription', body: null });

        expect(lastFetchCall()[1].body).toBeUndefined();
    });

    // The inversion of normal HTTP client behaviour: the SDK reads Status to decide whether a
    // call is retryable, so a non-2xx must never surface as a rejection.
    it.each([400, 401, 422, 500])('resolves rather than rejects on %i', async (status) => {
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(status, '{"Code":2001,"Error":"nope"}'));

        await expect(
            getApi().apiRequest({ method: 'POST', endpoint: '/payments/v5/subscription', body: '{}' })
        ).resolves.toEqual({ Status: status, Body: { Code: 2001, Error: 'nope' } });
    });

    it('resolves with a null body when the response has no body', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(500, ''));

        await expect(
            getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/plans', body: null })
        ).resolves.toEqual({ Status: 500, Body: null });
    });

    it('resolves with a null body when the response is not JSON', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(502, '<html>Bad Gateway</html>'));

        await expect(
            getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/plans', body: null })
        ).resolves.toEqual({ Status: 502, Body: null });
    });

    it('does not apply the getSubscriptions 422 special case', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse(422, '{"Code":22110}'));

        const result = await getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/subscription', body: null });

        expect(result.Status).toBe(422);
    });

    it('rejects when no HTTP response was received', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(
            getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/plans', body: null })
        ).rejects.toThrow('Failed to fetch');
    });

    it('rejects when no session UID has been set', async () => {
        getApi().setUid('');

        await expect(
            getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/plans', body: null })
        ).rejects.toThrow('UID must be set');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    describe('x-pm-appversion', () => {
        const appVersion = async () => {
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse(200, '{}'));
            await getApi().apiRequest({ method: 'GET', endpoint: '/payments/v5/plans', body: null });
            return (lastFetchCall()[1].headers as Record<string, string>)['x-pm-appversion'];
        };

        it('reports the native version advertised by the Android client', async () => {
            setUserAgent(ANDROID_UA);
            await expect(appVersion()).resolves.toBe('android-lumo@2.1.0');
        });

        it('reports the native version advertised by the iOS client', async () => {
            setUserAgent(IOS_UA);
            await expect(appVersion()).resolves.toBe('ios-lumo@2.1.0');
        });

        // Build-flavour suffixes are part of the User-Agent but not of a valid app version.
        it.each([
            ['-gms', ANDROID_UA],
            ['-noGms', ANDROID_NO_GMS_UA],
        ])('strips the %s build-flavour suffix', async (_suffix, userAgent) => {
            setUserAgent(userAgent);
            await expect(appVersion()).resolves.toBe('android-lumo@2.1.0');
        });

        it('falls back to the web app version outside a native WebView', async () => {
            setUserAgent(BROWSER_UA);
            await expect(appVersion()).resolves.toMatch(/^web-lumo@/);
        });

        it('falls back to the web app version when the native version is not x.y.z', async () => {
            setUserAgent('ProtonLumo/nightly (Android 16; Google sdk_gphone64_arm64)');
            await expect(appVersion()).resolves.toMatch(/^web-lumo@/);
        });
    });
});

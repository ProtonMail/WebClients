import { getIframeUrl, getInitializationFailureReason } from './ChargebeeIframe';

describe('getIframeUrl', () => {
    beforeAll(() => {
        // Mock the getter for window.location.origin
        jest.spyOn(window, 'location', 'get').mockReturnValue({
            ...window.location,
            origin: 'https://account.proton.me',
        } as Location);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should return the correct URL', () => {
        const url = getIframeUrl();
        expect(url.href).toEqual('https://account-api.proton.me/payments/v5/forms/cards');
    });

    it('should not be localhost', () => {
        const url = getIframeUrl();
        expect(url.host.includes('localhost')).toEqual(false);
    });
});

describe('getInitializationFailureReason', () => {
    it('should report the parent RPC deadline as a timeout', () => {
        const timeout = {
            type: 'get-height-response',
            correlationId: 'id-1',
            status: 'failure',
            error: 'Timeout exceeded',
        };

        expect(getInitializationFailureReason(timeout)).toBe('timeout');
    });

    it('should report a failure envelope as coming from the iframe', () => {
        const envelope = {
            type: 'set-configuration-response',
            correlationId: 'id-2',
            status: 'failure',
            error: { name: 'ChargebeeError', message: 'Fields never mounted' },
        };

        expect(getInitializationFailureReason(envelope)).toBe('reported-by-iframe');
    });

    it('should not blame the iframe for a plain Error thrown on the parent side', () => {
        expect(getInitializationFailureReason(new Error('Apple Pay session aborted'))).toBe('parent-side-error');
    });
});

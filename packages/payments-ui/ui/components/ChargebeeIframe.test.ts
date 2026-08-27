import { getIframeUrl } from './ChargebeeIframe';

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

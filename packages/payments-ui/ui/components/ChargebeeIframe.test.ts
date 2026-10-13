import { act, renderHook } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import type { PaymentIntent } from '@proton/chargebee/lib/types';

import { getIframeUrl, getInitializationFailureReason, useCbIframe } from './ChargebeeIframe';

jest.mock('@proton/app-context/useApi', () => ({
    useApi: jest
        .fn()
        .mockReturnValue(jest.fn().mockResolvedValue({ Site: 'site', PublishableKey: 'key', Domain: 'domain' })),
}));

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: jest.fn().mockReturnValue({ createNotification: jest.fn() }),
}));

jest.mock('@proton/components/containers/themes/ThemeProvider', () => ({
    useTheme: jest.fn().mockReturnValue({ information: {} }),
}));

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

describe('validateSavedCreditCard', () => {
    const paymentIntent = { id: 'payment-intent-1' } as PaymentIntent;

    const flushPromises = () => act(() => jest.advanceTimersByTimeAsync(0));

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    const setup = () => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        const contentWindow = iframe.contentWindow as Window;
        const postMessage = jest.spyOn(contentWindow, 'postMessage').mockImplementation(() => {});

        const { result, unmount } = renderHook(() => useCbIframe());
        result.current.iframeRef.current = iframe;

        const getPostedMessages = () => postMessage.mock.calls.map(([message]) => JSON.parse(message));
        const getPostedMessageTypes = () => getPostedMessages().map(({ type }) => type);

        const respondSuccessTo = (type: string) => {
            const { correlationId } = getPostedMessages().findLast((message) => message.type === type);
            window.dispatchEvent(
                new MessageEvent('message', {
                    source: contentWindow,
                    data: JSON.stringify({ type: `${type}-response`, correlationId, status: 'success' }),
                })
            );
        };

        return { cbIframe: result.current, getPostedMessages, getPostedMessageTypes, respondSuccessTo, unmount };
    };

    it('should wait for the iframe to load and the saved card setup to settle before verifying the card', async () => {
        const { cbIframe, getPostedMessages, getPostedMessageTypes, respondSuccessTo, unmount } = setup();

        void cbIframe.handles.initializeSavedCreditCard();
        await flushPromises();
        const verification = cbIframe.handles.validateSavedCreditCard({ paymentIntent });
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration']);

        cbIframe.notifyIframeLoaded();
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration']);

        respondSuccessTo('set-configuration');
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration', 'chargebee-verify-saved-card']);
        expect(getPostedMessages()[1].paymentIntent).toEqual(paymentIntent);

        respondSuccessTo('chargebee-verify-saved-card');

        await expect(verification).resolves.toEqual(
            expect.objectContaining({ type: 'chargebee-verify-saved-card-response', status: 'success' })
        );

        unmount();
    });

    it('should fail the verification when the iframe does not load in time', async () => {
        const { cbIframe, getPostedMessageTypes, unmount } = setup();
        const { createNotification } = useNotifications();

        const verification = cbIframe.handles.validateSavedCreditCard({ paymentIntent });
        const rejection = expect(verification).rejects.toThrow('Timeout exceeded');
        await act(() => jest.advanceTimersByTimeAsync(20000));

        await rejection;
        expect(getPostedMessageTypes()).toEqual([]);
        expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Timeout exceeded' });

        unmount();
    });

    it('should not wait for a saved card setup started before the iframe reloaded', async () => {
        const { cbIframe, getPostedMessageTypes, unmount } = setup();

        cbIframe.notifyIframeLoaded();
        void cbIframe.handles.initializeSavedCreditCard();
        await flushPromises();
        cbIframe.notifyIframeUnloaded();
        cbIframe.notifyIframeLoaded();

        void cbIframe.handles.validateSavedCreditCard({ paymentIntent });
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration', 'chargebee-verify-saved-card']);

        unmount();
    });
});

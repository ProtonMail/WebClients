import { StrictMode, createElement } from 'react';

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import type { PaymentIntent } from '@proton/chargebee/lib/types';
import { capturePaymentMessage } from '@proton/payments/sentry/capture';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/errors';
import { createApiError } from '@proton/shared/lib/fetch/ApiError';
import { setLocation } from '@proton/vitest-config/setLocation';

import {
    ChargebeeIframe,
    getIframeUrl,
    getInitializationFailureReason,
    getUnhandledIframeErrorLevel,
    isInitializationFailureReportable,
    useCbIframe,
} from './ChargebeeIframe';

vi.mock('@proton/app-context/useApi', () => ({
    useApi: vi
        .fn()
        .mockReturnValue(vi.fn().mockResolvedValue({ Site: 'site', PublishableKey: 'key', Domain: 'domain' })),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({ createNotification: vi.fn() }),
}));

vi.mock('@proton/components/containers/themes/ThemeProvider', () => ({
    useTheme: vi.fn().mockReturnValue({ information: {} }),
}));

vi.mock('@proton/payments/sentry/capture', async () => ({
    ...(await vi.importActual<Record<string, unknown>>('@proton/payments/sentry/capture')),
    capturePaymentMessage: vi.fn(),
}));

describe('getIframeUrl', () => {
    beforeAll(() => {
        setLocation('https://account.proton.me');
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

describe('isInitializationFailureReportable', () => {
    it('should skip a set-configuration failure because the iframe already reported it', () => {
        const envelope = {
            type: 'set-configuration-response',
            correlationId: 'id-1',
            status: 'failure',
            error: { name: 'Error', message: 'Chargebee script failed to load' },
        };

        expect(isInitializationFailureReportable(envelope)).toBe(false);
    });

    it('should report a set-configuration timeout', () => {
        const timeout = {
            type: 'set-configuration-response',
            correlationId: 'id-1',
            status: 'failure',
            error: 'Timeout exceeded',
        };

        expect(isInitializationFailureReportable(timeout)).toBe(true);
    });

    it('should report a failure envelope from another iframe action', () => {
        const envelope = {
            type: 'set-paypal-payment-intent-response',
            correlationId: 'id-2',
            status: 'failure',
            error: { name: 'ChargebeeError', message: 'Paypal failed' },
        };

        expect(isInitializationFailureReportable(envelope)).toBe(true);
    });

    it.each([
        Object.assign(new Error('No network connection'), { name: 'OfflineError' }),
        Object.assign(new Error('Request timed out'), { name: 'TimeoutError' }),
        Object.assign(new Error('signal is aborted without reason'), { name: 'AbortError' }),
        new TypeError('Failed to fetch'),
    ])('should skip the network error $name', (error) => {
        expect(isInitializationFailureReportable(error)).toBe(false);
    });

    it('should report a parent-side Error', () => {
        expect(isInitializationFailureReportable(new Error('Apple Pay session aborted'))).toBe(true);
    });

    it('should skip a 401 from the API because the session is gone', () => {
        const unauthorized = createApiError(
            'StatusCodeError',
            new Response(null, { status: 401 }),
            {},
            {
                Code: 401,
                Error: 'Invalid access token',
            }
        );

        expect(isInitializationFailureReportable(unauthorized)).toBe(false);
    });

    it('should skip an inactive session after the token refresh failed', () => {
        expect(isInitializationFailureReportable(InactiveSessionError())).toBe(false);
    });

    it('should report another 4xx from the API with a message', () => {
        const unprocessable = createApiError(
            'StatusCodeError',
            new Response(null, { status: 422 }),
            {},
            {
                Code: 422,
                Error: 'Invalid input',
            }
        );

        expect(isInitializationFailureReportable(unprocessable)).toBe(true);
    });
});

describe('getUnhandledIframeErrorLevel', () => {
    it.each(['card_load_components_timed_out', 'card_mount_timed_out', 'initialize_timed_out'])(
        'should report the %s stage as a warning',
        (stage) => {
            expect(getUnhandledIframeErrorLevel(stage)).toBe('warning');
        }
    );

    it.each(['chargebee.load_failed', 'card_loaded_components', 'unknown'])(
        'should report the %s stage as an error',
        (stage) => {
            expect(getUnhandledIframeErrorLevel(stage)).toBe('error');
        }
    );
});

const flushPromises = () => act(() => vi.advanceTimersByTimeAsync(0));

const setup = () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const contentWindow = iframe.contentWindow as Window;
    const postMessage = vi.spyOn(contentWindow, 'postMessage').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useCbIframe());
    result.current.iframeRef.current = iframe;

    const getPostedMessages = () => postMessage.mock.calls.map(([message]) => JSON.parse(message));
    const getPostedMessageTypes = () => getPostedMessages().map(({ type }) => type);

    const respondTo = (type: string, status: 'success' | 'failure') => {
        const { correlationId } = getPostedMessages().findLast((message) => message.type === type);
        window.dispatchEvent(
            new MessageEvent('message', {
                source: contentWindow,
                data: JSON.stringify({ type: `${type}-response`, correlationId, status }),
            })
        );
    };
    const respondSuccessTo = (type: string) => respondTo(type, 'success');
    const respondFailureTo = (type: string) => respondTo(type, 'failure');

    return {
        cbIframe: result.current,
        getPostedMessages,
        getPostedMessageTypes,
        respondSuccessTo,
        respondFailureTo,
        unmount,
    };
};

describe('validateCardForm', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('should wait for the card form setup before validating it', async () => {
        const { cbIframe, getPostedMessageTypes, respondSuccessTo, unmount } = setup();

        cbIframe.notifyIframeLoaded();
        void cbIframe.handles.initializeCreditCard({ isNarrow: false });
        await flushPromises();
        const validation = cbIframe.handles.validateCardForm();
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration']);

        respondSuccessTo('set-configuration');
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration', 'validate-form']);

        respondSuccessTo('validate-form');

        await expect(validation).resolves.toEqual(
            expect.objectContaining({ type: 'validate-form-response', status: 'success' })
        );

        unmount();
    });

    it('should still ask the iframe after the card form setup failed', async () => {
        const { cbIframe, getPostedMessageTypes, respondFailureTo, unmount } = setup();

        cbIframe.notifyIframeLoaded();
        cbIframe.handles.initializeCreditCard({ isNarrow: false }).catch(() => {});
        await flushPromises();
        void cbIframe.handles.validateCardForm();
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration']);

        respondFailureTo('set-configuration');
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration', 'validate-form']);

        unmount();
    });

    it('should wait for the iframe to load and the card form setup to settle before validating it', async () => {
        const { cbIframe, getPostedMessageTypes, respondSuccessTo, unmount } = setup();

        void cbIframe.handles.validateCardForm();
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual([]);

        cbIframe.notifyIframeLoaded();
        void cbIframe.handles.initializeCreditCard({ isNarrow: false });
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration']);

        respondSuccessTo('set-configuration');
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration', 'validate-form']);

        unmount();
    });

    it('should fail the validation when the iframe does not load in time', async () => {
        const { cbIframe, getPostedMessageTypes, unmount } = setup();

        const validation = cbIframe.handles.validateCardForm();
        const rejection = expect(validation).rejects.toEqual({
            type: 'validate-form-response',
            status: 'failure',
            error: 'Timeout exceeded',
        });
        await act(() => vi.advanceTimersByTimeAsync(20000));

        await rejection;
        expect(getPostedMessageTypes()).toEqual([]);

        unmount();
    });

    it('should fail the validation 20s after it was asked even when the card form setup is still running', async () => {
        const { cbIframe, getPostedMessageTypes, unmount } = setup();

        const validation = cbIframe.handles.validateCardForm();
        const rejection = expect(validation).rejects.toEqual({
            type: 'validate-form-response',
            status: 'failure',
            error: 'Timeout exceeded',
        });
        await act(() => vi.advanceTimersByTimeAsync(15000));
        cbIframe.notifyIframeLoaded();
        cbIframe.handles.initializeCreditCard({ isNarrow: false }).catch(() => {});
        await act(() => vi.advanceTimersByTimeAsync(5000));

        await rejection;
        expect(getPostedMessageTypes()).toEqual(['set-configuration']);

        unmount();
    });

    it('should give the iframe only the time left until 20s after the validation was asked', async () => {
        const { cbIframe, getPostedMessageTypes, respondSuccessTo, unmount } = setup();

        cbIframe.notifyIframeLoaded();
        void cbIframe.handles.initializeCreditCard({ isNarrow: false });
        const validation = cbIframe.handles.validateCardForm();
        let settled = false;
        validation.catch(() => {}).finally(() => (settled = true));
        await act(() => vi.advanceTimersByTimeAsync(15000));
        respondSuccessTo('set-configuration');
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration', 'validate-form']);

        await act(() => vi.advanceTimersByTimeAsync(4900));
        expect(settled).toBe(false);
        await act(() => vi.advanceTimersByTimeAsync(200));

        await expect(validation).rejects.toEqual(
            expect.objectContaining({ type: 'validate-form-response', error: 'Timeout exceeded' })
        );

        unmount();
    });

    it('should not wait for a card form setup started before the iframe reloaded', async () => {
        const { cbIframe, getPostedMessageTypes, unmount } = setup();

        cbIframe.notifyIframeLoaded();
        void cbIframe.handles.initializeCreditCard({ isNarrow: false });
        await flushPromises();
        cbIframe.notifyIframeUnloaded();
        cbIframe.notifyIframeLoaded();

        void cbIframe.handles.validateCardForm();
        await flushPromises();

        expect(getPostedMessageTypes()).toEqual(['set-configuration', 'validate-form']);

        unmount();
    });
});

describe('validateSavedCreditCard', () => {
    const paymentIntent = { id: 'payment-intent-1' } as PaymentIntent;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

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
        await act(() => vi.advanceTimersByTimeAsync(20000));

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

describe('card setup timeout report', () => {
    const CARD_SETUP_TIMEOUT_REPORT = 'Payments: Chargebee iframe failed to initialize (card, timeout)';

    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(capturePaymentMessage).mockClear();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    const PaymentForm = ({ showCardForm, strictMode }: { showCardForm: boolean; strictMode?: boolean }) => {
        const iframeHandles = useCbIframe();
        if (!showCardForm) {
            return null;
        }

        const cardForm = createElement(ChargebeeIframe, { type: 'card', iframeHandles });
        return strictMode ? createElement(StrictMode, null, cardForm) : cardForm;
    };

    const startCardSetup = async ({ strictMode }: { strictMode?: boolean } = {}) => {
        const view = render(createElement(PaymentForm, { showCardForm: true, strictMode }));
        const iframe = screen.getByTestId('chargebee-iframe') as HTMLIFrameElement;
        vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {});

        fireEvent.load(iframe);
        await flushPromises();

        return view;
    };

    const getReportedMessages = () => vi.mocked(capturePaymentMessage).mock.calls.map(([message]) => message);

    it('should report a card setup that never answers while the card form is shown', async () => {
        await startCardSetup();

        await act(() => vi.advanceTimersByTimeAsync(20000));

        expect(getReportedMessages()).toEqual([CARD_SETUP_TIMEOUT_REPORT]);
    });

    it('should not report the card setup once the user switched to another payment method', async () => {
        const { rerender } = await startCardSetup();

        rerender(createElement(PaymentForm, { showCardForm: false }));
        await act(() => vi.advanceTimersByTimeAsync(20000));

        expect(getReportedMessages()).toEqual([]);
    });

    it('should still report the card setup after a StrictMode remount', async () => {
        await startCardSetup({ strictMode: true });

        await act(() => vi.advanceTimersByTimeAsync(20000));

        expect(getReportedMessages()).toEqual([CARD_SETUP_TIMEOUT_REPORT]);
    });
});

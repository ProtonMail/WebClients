import { act, renderHook, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { AmountAndCurrency, ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { apiMock } from '@proton/test-api/api';

import {
    getMockedEvents,
    getMockedWalletHandles,
    mockPaymentIntent,
    mockTokenStatus,
} from './__mocks__/wallet-test-helpers';
import { type ApplePayModalHandles, useApplePay } from './useApplePay';

const amountAndCurrency: AmountAndCurrency = { Amount: 1000, Currency: 'USD' };

const getModalHandles = (): ApplePayModalHandles => ({
    onAuthorize: jest.fn(),
    onClick: jest.fn(),
    onFailure: jest.fn(),
    onCancel: jest.fn(),
    onMountFailure: jest.fn(),
});

const renderApplePay = ({
    handles = getMockedWalletHandles(),
    iframeLoaded = true,
}: { handles?: ChargebeeIframeHandles; iframeLoaded?: boolean } = {}) => {
    const { events, fire, isSubscribed, removed } = getMockedEvents();
    const applePayModalHandles = getModalHandles();
    const onChargeable = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
        useApplePay({ amountAndCurrency, onChargeable }, { api: apiMock, handles, events, applePayModalHandles })
    );

    result.current.applePayIframeLoadedRef.current = iframeLoaded;

    return { result, handles, applePayModalHandles, onChargeable, fire, isSubscribed, removed };
};

const initialize = async (run: (signal: AbortSignal) => Promise<void>) => {
    await act(async () => {
        await run(new AbortController().signal);
    });
};

describe('useApplePay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPaymentIntent();
        mockTokenStatus(PAYMENT_TOKEN_STATUS.CHARGEABLE);
    });

    it('reports itself as the apple pay processor', () => {
        const { result } = renderApplePay();
        expect(result.current.meta.type).toBe(PAYMENT_METHOD_TYPES.APPLE_PAY);
    });

    it('does nothing until the iframe has loaded', async () => {
        const { result, handles } = renderApplePay({ iframeLoaded: false });

        await initialize(result.current.initialize);

        expect(handles.initializeApplePay).not.toHaveBeenCalled();
        expect(apiMock).not.toHaveBeenCalled();
    });

    it('initializes the iframe, fetches a token and arms the payment intent', async () => {
        const { result, handles } = renderApplePay();

        await initialize(result.current.initialize);

        expect(handles.initializeApplePay).toHaveBeenCalled();
        await waitFor(() => expect(handles.setApplePayPaymentIntent).toHaveBeenCalled());
    });

    it('subscribes to all four apple pay events', async () => {
        const { result, isSubscribed } = renderApplePay();

        await initialize(result.current.initialize);

        await waitFor(() => expect(isSubscribed('onApplePayAuthorized')).toBe(true));
        expect(isSubscribed('onApplePayClicked')).toBe(true);
        expect(isSubscribed('onApplePayFailure')).toBe(true);
        expect(isSubscribed('onApplePayCancelled')).toBe(true);
    });

    it('charges the token once authorized and the status is chargeable', async () => {
        const { result, fire, onChargeable, applePayModalHandles } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await fire('onApplePayAuthorized');
        });

        expect(applePayModalHandles.onAuthorize).toHaveBeenCalled();
        expect(onChargeable).toHaveBeenCalledWith(
            expect.objectContaining({ chargeable: true, type: PAYMENT_METHOD_TYPES.APPLE_PAY, PaymentToken: 'token' })
        );
    });

    it('does not charge when the token status is not chargeable', async () => {
        mockTokenStatus(PAYMENT_TOKEN_STATUS.PENDING);
        const { result, fire, onChargeable } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await fire('onApplePayAuthorized');
        });

        expect(onChargeable).not.toHaveBeenCalled();
    });

    // onAuthorize is what dismisses the pending-verification modal, so it must fire even when the
    // token never becomes chargeable
    it('still tells the modal the user authorized when the token is not chargeable', async () => {
        mockTokenStatus(PAYMENT_TOKEN_STATUS.PENDING);
        const { result, fire, applePayModalHandles } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await fire('onApplePayAuthorized');
        });

        expect(applePayModalHandles.onAuthorize).toHaveBeenCalled();
    });

    it.each([
        ['onApplePayClicked', 'onClick'],
        ['onApplePayCancelled', 'onCancel'],
    ] as const)('forwards %s to the modal', async (event, handle) => {
        const { result, fire, applePayModalHandles } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await fire(event);
        });

        expect(applePayModalHandles[handle]).toHaveBeenCalled();
    });

    it('forwards the failure error to the modal', async () => {
        const { result, fire, applePayModalHandles } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        const error = new Error('declined');
        await act(async () => {
            await fire('onApplePayFailure', error);
        });

        expect(applePayModalHandles.onFailure).toHaveBeenCalledWith(error);
    });

    it.each(['applePayNotSupported', 'applePayPaymentsNotAvailable'])(
        'tells the modal the device cannot run apple pay on %s',
        async (code) => {
            const handles = getMockedWalletHandles();
            handles.initializeApplePay = jest.fn().mockRejectedValue({ error: { code } });

            const { result, applePayModalHandles } = renderApplePay({ handles });

            await initialize(result.current.initialize);

            await waitFor(() => expect(applePayModalHandles.onMountFailure).toHaveBeenCalled());
        }
    );

    it('swallows any other initialization error without reporting a mount failure', async () => {
        const handles = getMockedWalletHandles();
        handles.initializeApplePay = jest.fn().mockRejectedValue({ error: { code: 'card_declined' } });

        const { result, applePayModalHandles } = renderApplePay({ handles });

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        expect(applePayModalHandles.onMountFailure).not.toHaveBeenCalled();
    });

    it('removes its listeners on reset', async () => {
        const { result, removed } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        act(() => result.current.reset());

        expect(removed).toEqual(
            expect.arrayContaining([
                'onApplePayAuthorized',
                'onApplePayClicked',
                'onApplePayFailure',
                'onApplePayCancelled',
            ])
        );
    });

    it('charges only once even if authorization fires twice', async () => {
        const { result, fire, onChargeable } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await fire('onApplePayAuthorized');
            await fire('onApplePayAuthorized');
        });

        expect(onChargeable).toHaveBeenCalledTimes(1);
    });

    it('stops listening for authorization after a reset', async () => {
        const { result, isSubscribed } = renderApplePay();

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializing).toBe(false));

        act(() => result.current.reset());

        expect(isSubscribed('onApplePayAuthorized')).toBe(false);
    });
});

import { act, renderHook, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { AmountAndCurrency, ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { addApiMock, apiMock } from '@proton/test-api/api';

import { getMockedEvents, getMockedWalletHandles, mockPaymentIntent } from './__mocks__/wallet-test-helpers';
import { type ChargebeePaypalModalHandles, useChargebeePaypal } from './useChargebeePaypal';

const amountAndCurrency: AmountAndCurrency = { Amount: 1000, Currency: 'USD' };

const getModalHandles = (): ChargebeePaypalModalHandles => ({
    onAuthorize: jest.fn(),
    onClick: jest.fn(),
    onFailure: jest.fn(),
    onCancel: jest.fn(),
});

const renderPaypal = ({
    handles = getMockedWalletHandles(),
    iframeLoaded = true,
}: { handles?: ChargebeeIframeHandles; iframeLoaded?: boolean } = {}) => {
    const { events, fire, isSubscribed, removed } = getMockedEvents();
    const chargebeePaypalModalHandles = getModalHandles();
    const onChargeable = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
        useChargebeePaypal(
            { amountAndCurrency, onChargeable },
            { api: apiMock, handles, events, chargebeePaypalModalHandles }
        )
    );

    result.current.paypalIframeLoadedRef.current = iframeLoaded;

    return { result, handles, chargebeePaypalModalHandles, onChargeable, fire, isSubscribed, removed };
};

const initialize = async (run: (signal: AbortSignal) => Promise<void>) => {
    await act(async () => {
        await run(new AbortController().signal);
    });
};

const initialized = async (rendered: ReturnType<typeof renderPaypal>) => {
    await initialize(rendered.result.current.initialize);
    await waitFor(() => expect(rendered.result.current.initializing).toBe(false));
    return rendered;
};

describe('useChargebeePaypal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPaymentIntent();
        addApiMock('payments/v5/tokens/token', () => ({ Status: PAYMENT_TOKEN_STATUS.CHARGEABLE }));
    });

    it('reports itself as the chargebee paypal processor', () => {
        const { result } = renderPaypal();
        expect(result.current.meta.type).toBe('chargebee-paypal');
    });

    it('does nothing until the iframe has loaded', async () => {
        const { result, handles } = renderPaypal({ iframeLoaded: false });

        await initialize(result.current.initialize);

        expect(handles.initializePaypal).not.toHaveBeenCalled();
        expect(apiMock).not.toHaveBeenCalled();
    });

    it('initializes the iframe, fetches a token and arms the payment intent', async () => {
        const rendered = await initialized(renderPaypal());

        expect(rendered.handles.initializePaypal).toHaveBeenCalled();
        expect(rendered.handles.setPaypalPaymentIntent).toHaveBeenCalled();
    });

    it('subscribes to all four paypal events', async () => {
        const rendered = await initialized(renderPaypal());

        expect(rendered.isSubscribed('onPaypalAuthorized')).toBe(true);
        expect(rendered.isSubscribed('onPaypalClicked')).toBe(true);
        expect(rendered.isSubscribed('onPaypalFailure')).toBe(true);
        expect(rendered.isSubscribed('onPaypalCancelled')).toBe(true);
    });

    it('charges the token once authorized and the status is chargeable', async () => {
        const rendered = await initialized(renderPaypal());

        await act(async () => {
            await rendered.fire('onPaypalAuthorized');
        });

        expect(rendered.chargebeePaypalModalHandles.onAuthorize).toHaveBeenCalled();
        expect(rendered.onChargeable).toHaveBeenCalledWith(
            expect.objectContaining({
                chargeable: true,
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                PaymentToken: 'token',
            })
        );
    });

    it('does not charge when the token status is not chargeable', async () => {
        addApiMock('payments/v5/tokens/token', () => ({ Status: PAYMENT_TOKEN_STATUS.PENDING }));
        const rendered = await initialized(renderPaypal());

        await act(async () => {
            await rendered.fire('onPaypalAuthorized');
        });

        expect(rendered.onChargeable).not.toHaveBeenCalled();
    });

    // onAuthorize is what dismisses the pending-verification modal, so it must fire even when the
    // token never becomes chargeable
    it('still tells the modal the user authorized when the token is not chargeable', async () => {
        addApiMock('payments/v5/tokens/token', () => ({ Status: PAYMENT_TOKEN_STATUS.PENDING }));
        const rendered = await initialized(renderPaypal());

        await act(async () => {
            await rendered.fire('onPaypalAuthorized');
        });

        expect(rendered.chargebeePaypalModalHandles.onAuthorize).toHaveBeenCalled();
    });

    it.each([
        ['onPaypalClicked', 'onClick'],
        ['onPaypalCancelled', 'onCancel'],
    ] as const)('forwards %s to the modal', async (event, handle) => {
        const rendered = await initialized(renderPaypal());

        await act(async () => {
            await rendered.fire(event);
        });

        expect(rendered.chargebeePaypalModalHandles[handle]).toHaveBeenCalled();
    });

    it('forwards the failure error to the modal', async () => {
        const rendered = await initialized(renderPaypal());

        const error = new Error('declined');
        await act(async () => {
            await rendered.fire('onPaypalFailure', error);
        });

        expect(rendered.chargebeePaypalModalHandles.onFailure).toHaveBeenCalledWith(error);
    });

    it('removes its listeners on reset', async () => {
        const rendered = await initialized(renderPaypal());

        act(() => rendered.result.current.reset());

        expect(rendered.removed).toEqual(
            expect.arrayContaining(['onPaypalAuthorized', 'onPaypalClicked', 'onPaypalFailure', 'onPaypalCancelled'])
        );
    });

    it('charges only once even if authorization fires twice', async () => {
        const rendered = await initialized(renderPaypal());

        await act(async () => {
            await rendered.fire('onPaypalAuthorized');
            await rendered.fire('onPaypalAuthorized');
        });

        expect(rendered.onChargeable).toHaveBeenCalledTimes(1);
    });

    it('stops listening for authorization after a reset', async () => {
        const rendered = await initialized(renderPaypal());

        act(() => rendered.result.current.reset());

        expect(rendered.isSubscribed('onPaypalAuthorized')).toBe(false);
    });
});

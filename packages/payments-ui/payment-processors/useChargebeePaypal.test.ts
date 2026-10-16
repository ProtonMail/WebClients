import { act, renderHook, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { AmountAndCurrency, ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import { addApiMock, apiMock } from '@proton/test-api/api';

import {
    deferTokenRequests,
    getMockedEvents,
    getMockedWalletHandles,
    getRequestedTokenAmounts,
    mockPaymentIntent,
} from './__mocks__/wallet-test-helpers';
import { type ChargebeePaypalModalHandles, useChargebeePaypal } from './useChargebeePaypal';

jest.mock('@proton/payments/sentry/capture', () => ({ tracePaymentError: jest.fn() }));

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

    it('reports a token status failure as a refactor-path error without rethrowing it', async () => {
        const error = new Error('Failed to fetch');
        addApiMock('payments/v5/tokens/token', () => {
            throw error;
        });
        const rendered = await initialized(renderPaypal());

        await act(async () => {
            await rendered.fire('onPaypalAuthorized');
        });

        expect(rendered.chargebeePaypalModalHandles.onFailure).not.toHaveBeenCalled();
        expect(tracePaymentError).toHaveBeenCalledWith(
            error,
            expect.objectContaining({ component: 'use-chargebee-wallet', featureFlag: 'PaymentProcessorsRefactor' })
        );
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

    describe('when the amount changes while paypal is being set up', () => {
        const oldAmount: AmountAndCurrency = { Amount: 5000, Currency: 'USD' };
        const newAmount: AmountAndCurrency = { Amount: 1000, Currency: 'USD' };
        const outdatedAmount: AmountAndCurrency = { Amount: 2000, Currency: 'USD' };

        const renderWithAmount = () => {
            const { events, fire, isSubscribed } = getMockedEvents();
            const handles = getMockedWalletHandles();
            const onChargeable = jest.fn().mockResolvedValue(undefined);

            const { result, rerender } = renderHook(
                ({ amount }: { amount: AmountAndCurrency }) =>
                    useChargebeePaypal(
                        { amountAndCurrency: amount, onChargeable },
                        { api: apiMock, handles, events, chargebeePaypalModalHandles: getModalHandles() }
                    ),
                { initialProps: { amount: oldAmount } }
            );
            result.current.paypalIframeLoadedRef.current = true;

            const startSetup = async (abortSignal = new AbortController().signal) => {
                await act(async () => {
                    result.current.reset();
                    await result.current.initialize(abortSignal);
                });
            };

            const changeAmountAndStartSetup = async (amount = newAmount) => {
                rerender({ amount });
                await startSetup();
            };

            return { handles, fire, isSubscribed, onChargeable, startSetup, changeAmountAndStartSetup };
        };

        // overlapping token requests can fail at the payment provider (422, Code 2900)
        it('requests the token for the new amount only after the request for the old amount settles', async () => {
            const tokens = deferTokenRequests();
            const rendered = renderWithAmount();

            await rendered.startSetup();
            await rendered.changeAmountAndStartSetup();
            expect(getRequestedTokenAmounts()).toEqual([oldAmount.Amount]);

            await tokens.resolve(oldAmount, 'old-token');
            expect(getRequestedTokenAmounts()).toEqual([oldAmount.Amount, newAmount.Amount]);
        });

        it('still requests the token for the new amount and arms paypal with it when the request for the old amount fails', async () => {
            const tokens = deferTokenRequests();
            const rendered = renderWithAmount();

            await rendered.startSetup();
            await rendered.changeAmountAndStartSetup();
            await tokens.reject(oldAmount);
            expect(getRequestedTokenAmounts()).toEqual([oldAmount.Amount, newAmount.Amount]);

            await tokens.resolve(newAmount, 'new-token');

            await waitFor(() => expect(rendered.handles.setPaypalPaymentIntent).toHaveBeenCalledTimes(1));
            expect(rendered.handles.setPaypalPaymentIntent).toHaveBeenCalledWith(
                { paymentIntent: expect.objectContaining({ id: 'new-token' }) },
                expect.anything()
            );
        });

        it('does not arm paypal with the old amount when the request for the new amount fails', async () => {
            const tokens = deferTokenRequests();
            const rendered = renderWithAmount();

            await rendered.startSetup();
            await rendered.changeAmountAndStartSetup();
            await tokens.resolve(oldAmount, 'old-token');
            await tokens.reject(newAmount);

            expect(rendered.handles.setPaypalPaymentIntent).not.toHaveBeenCalled();
            expect(rendered.isSubscribed('onPaypalAuthorized')).toBe(false);
        });

        it('does not arm paypal when the caller aborts the setup', async () => {
            const tokens = deferTokenRequests();
            const rendered = renderWithAmount();
            const abortController = new AbortController();

            await rendered.startSetup(abortController.signal);
            abortController.abort();
            await tokens.resolve(oldAmount, 'old-token');

            expect(rendered.handles.setPaypalPaymentIntent).not.toHaveBeenCalled();
            expect(rendered.isSubscribed('onPaypalAuthorized')).toBe(false);
        });

        it('does not request the token for an amount that changed again while its request was queued', async () => {
            const tokens = deferTokenRequests();
            const rendered = renderWithAmount();

            await rendered.startSetup();
            await rendered.changeAmountAndStartSetup(outdatedAmount);
            await rendered.changeAmountAndStartSetup(newAmount);
            await tokens.resolve(oldAmount, 'old-token');
            expect(getRequestedTokenAmounts()).toEqual([oldAmount.Amount, newAmount.Amount]);

            await tokens.resolve(newAmount, 'new-token');

            await waitFor(() => expect(rendered.handles.setPaypalPaymentIntent).toHaveBeenCalledTimes(1));
            expect(rendered.handles.setPaypalPaymentIntent).toHaveBeenCalledWith(
                { paymentIntent: expect.objectContaining({ id: 'new-token' }) },
                expect.anything()
            );
        });

        it('arms paypal once and charges the new amount', async () => {
            const tokens = deferTokenRequests();
            addApiMock('payments/v5/tokens/new-token', () => ({ Status: PAYMENT_TOKEN_STATUS.CHARGEABLE }));
            addApiMock('payments/v5/tokens/old-token', () => ({ Status: PAYMENT_TOKEN_STATUS.CHARGEABLE }));
            const rendered = renderWithAmount();

            await rendered.startSetup();
            await rendered.changeAmountAndStartSetup();
            await tokens.resolve(oldAmount, 'old-token');
            await tokens.resolve(newAmount, 'new-token');

            await waitFor(() => expect(rendered.handles.setPaypalPaymentIntent).toHaveBeenCalledTimes(1));
            expect(rendered.handles.setPaypalPaymentIntent).toHaveBeenCalledWith(
                { paymentIntent: expect.objectContaining({ id: 'new-token' }) },
                expect.anything()
            );

            await act(async () => {
                await rendered.fire('onPaypalAuthorized');
            });
            expect(rendered.onChargeable).toHaveBeenCalledTimes(1);
            expect(rendered.onChargeable).toHaveBeenCalledWith(
                expect.objectContaining({ ...newAmount, PaymentToken: 'new-token' })
            );
        });
    });
});

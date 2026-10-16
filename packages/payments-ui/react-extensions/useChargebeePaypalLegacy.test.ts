import { act, renderHook, waitFor } from '@testing-library/react';

import { PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { AmountAndCurrency } from '@proton/payments/core/interface';
import { addApiMock, apiMock } from '@proton/test-api/api';

import {
    deferTokenRequests,
    getMockedEvents,
    getMockedWalletHandles,
    getRequestedTokenAmounts,
} from '../payment-processors/__mocks__/wallet-test-helpers';
import { useChargebeePaypal } from './useChargebeePaypalLegacy';

const oldAmount: AmountAndCurrency = { Amount: 5000, Currency: 'USD' };
const newAmount: AmountAndCurrency = { Amount: 1000, Currency: 'USD' };
const outdatedAmount: AmountAndCurrency = { Amount: 2000, Currency: 'USD' };

const renderWithAmount = () => {
    const { events, fire, isSubscribed } = getMockedEvents();
    const handles = getMockedWalletHandles();
    const onChargeable = jest.fn().mockResolvedValue(undefined);
    const chargebeePaypalModalHandles = {
        onAuthorize: jest.fn(),
        onCancel: jest.fn(),
        onClick: jest.fn(),
        onFailure: jest.fn(),
    };

    const { result, rerender } = renderHook(
        ({ amount }: { amount: AmountAndCurrency }) =>
            useChargebeePaypal(
                { amountAndCurrency: amount, onChargeable },
                { api: apiMock, verifyPayment: jest.fn(), handles, events, chargebeePaypalModalHandles }
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

describe('useChargebeePaypal (legacy) when the amount changes while paypal is being set up', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

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

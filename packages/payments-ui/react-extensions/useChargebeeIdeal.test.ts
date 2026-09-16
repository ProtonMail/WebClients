import { act, renderHook, waitFor } from '@testing-library/react';

import type { AmountAndCurrency, ChargebeeIframeEvents, ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { apiMock } from '@proton/testing/lib/api';

import { getMockedIframeHandles, mockPostV5Token } from './__mocks__/mock-helpers';
import { useChargebeeIdeal } from './useChargebeeIdeal';

const events = {
    onIdealAuthorized: jest.fn(() => jest.fn()),
    onIdealFailure: jest.fn(() => jest.fn()),
    onIdealClicked: jest.fn(() => jest.fn()),
    onIdealCancelled: jest.fn(() => jest.fn()),
} as unknown as ChargebeeIframeEvents;

const tokenCalls = () => apiMock.mock.calls.filter(([config]: any[]) => config?.url === 'payments/v5/tokens');

const renderIdealHook = (amountAndCurrency: AmountAndCurrency, handles: ChargebeeIframeHandles) => {
    const { result, rerender } = renderHook(
        (props: { amountAndCurrency: AmountAndCurrency }) =>
            useChargebeeIdeal({ amountAndCurrency: props.amountAndCurrency }, { api: apiMock, handles, events }),
        { initialProps: { amountAndCurrency } }
    );

    result.current.idealIframeLoadedRef.current = true;

    return { result, rerender };
};

const initialize = async (initializeIdeal: (abortSignal: AbortSignal) => Promise<void>, abortSignal?: AbortSignal) => {
    await act(async () => {
        await initializeIdeal(abortSignal ?? new AbortController().signal);
    });
};

describe('useChargebeeIdeal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPostV5Token({});
    });

    it('should not fetch a payment token when the currency is not supported by iDEAL', async () => {
        const handles = getMockedIframeHandles();
        const { result } = renderIdealHook({ Amount: 999, Currency: 'USD' }, handles);

        await initialize(result.current.initialize);

        expect(tokenCalls()).toHaveLength(0);
        expect(handles.initializeIdeal).not.toHaveBeenCalled();
    });

    it('should fetch exactly one payment token once the currency is overridden to EUR', async () => {
        const handles = getMockedIframeHandles();
        const { result, rerender } = renderIdealHook({ Amount: 999, Currency: 'USD' }, handles);

        await initialize(result.current.initialize);
        expect(tokenCalls()).toHaveLength(0);

        rerender({ amountAndCurrency: { Amount: 999, Currency: 'EUR' } });
        await initialize(result.current.initialize);

        expect(tokenCalls()).toHaveLength(1);
        expect(tokenCalls()[0][0].data).toMatchObject({ Currency: 'EUR' });
    });

    it('should not arm the iframe button before the account holder name is known', async () => {
        const handles = getMockedIframeHandles();
        const { result } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        await initialize(result.current.initialize);

        expect(handles.setIdealPaymentIntent).not.toHaveBeenCalled();
        expect(result.current.readyToPay).toBe(false);
    });

    it('should clear the initialization error after a successful retry', async () => {
        const handles = getMockedIframeHandles();
        jest.mocked(handles.initializeIdeal).mockRejectedValueOnce(new Error('iframe failure'));

        const { result } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializationError).toBe(true));

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializationError).toBe(false));
    });

    it('should send the trimmed account holder name once for a burst of keystrokes', async () => {
        jest.useFakeTimers();

        const handles = getMockedIframeHandles();
        const { result } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        await initialize(result.current.initialize);
        jest.mocked(handles.setIdealPaymentIntent).mockClear();

        for (const name of ['J', 'Ja', ' Jan ']) {
            act(() => result.current.setAccountHolderName(name));
        }
        expect(handles.setIdealPaymentIntent).not.toHaveBeenCalled();

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        expect(handles.setIdealPaymentIntent).toHaveBeenCalledTimes(1);
        expect(handles.setIdealPaymentIntent).toHaveBeenCalledWith(
            expect.objectContaining({ userName: 'Jan' }),
            expect.anything()
        );
        expect(result.current.readyToPay).toBe(true);

        jest.useRealTimers();
    });

    it('should surface an initialization error when the debounced name update fails', async () => {
        jest.useFakeTimers();

        const handles = getMockedIframeHandles();
        const { result } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        await initialize(result.current.initialize);
        jest.mocked(handles.setIdealPaymentIntent).mockRejectedValueOnce(new Error('iframe failure'));

        act(() => result.current.setAccountHolderName('Jan'));
        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        expect(result.current.initializationError).toBe(true);
        expect(result.current.readyToPay).toBe(false);

        act(() => result.current.setAccountHolderName('Jane'));
        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        expect(result.current.initializationError).toBe(false);
        expect(result.current.readyToPay).toBe(true);
        // the retry reuses the payment token instead of re-initializing
        expect(tokenCalls()).toHaveLength(1);

        jest.useRealTimers();
    });

    it('should clear a stale initialization error when the currency is no longer supported', async () => {
        const handles = getMockedIframeHandles();
        jest.mocked(handles.initializeIdeal).mockRejectedValueOnce(new Error('iframe failure'));

        const { result, rerender } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        await initialize(result.current.initialize);
        await waitFor(() => expect(result.current.initializationError).toBe(true));

        rerender({ amountAndCurrency: { Amount: 999, Currency: 'USD' } });
        await initialize(result.current.initialize);

        expect(result.current.initializationError).toBe(false);
    });

    it('should not register duplicate iDEAL listeners when the initialization is retried', async () => {
        const handles = getMockedIframeHandles();
        const { result } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        await initialize(result.current.initialize);
        await initialize(result.current.initialize);

        expect(events.onIdealAuthorized).toHaveBeenCalledTimes(2);
        const removeFirstListener = jest.mocked(events.onIdealAuthorized).mock.results[0].value;
        expect(removeFirstListener).toHaveBeenCalledTimes(1);
    });

    it('should not report an initialization error when a pending name send races a reset', async () => {
        jest.useFakeTimers();

        const handles = getMockedIframeHandles();
        const { result } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        await initialize(result.current.initialize);
        jest.mocked(handles.setIdealPaymentIntent).mockClear();

        act(() => result.current.setAccountHolderName('Jan'));
        result.current.reset();

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        expect(handles.setIdealPaymentIntent).not.toHaveBeenCalled();
        expect(result.current.initializationError).toBe(false);

        jest.useRealTimers();
    });

    it('should not report an initialization error when the initialization was aborted', async () => {
        const handles = getMockedIframeHandles();
        jest.mocked(handles.initializeIdeal).mockRejectedValueOnce(new Error('aborted'));

        const { result } = renderIdealHook({ Amount: 999, Currency: 'EUR' }, handles);

        const abortController = new AbortController();
        abortController.abort();
        await initialize(result.current.initialize, abortController.signal);

        expect(result.current.initializationError).toBe(false);
    });
});

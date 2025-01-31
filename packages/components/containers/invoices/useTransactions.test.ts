import { act, renderHook } from '@testing-library/react-hooks';

import { INVOICE_OWNER, TransactionState, TransactionType } from '@proton/payments';
import { queryTransactions } from '@proton/shared/lib/api/payments';
import { addApiMock, hookWrapper, withApi } from '@proton/testing';

import useTransactions from './useTransactions';

const wrapper = hookWrapper(withApi());

describe('useTransactions', () => {
    const mockTransactions = [
        // Visible transactions (should be included)
        {
            ID: '1',
            State: TransactionState.SUCCESS,
            Type: TransactionType.PAYMENT,
        },
        {
            ID: '2',
            State: TransactionState.FAILURE,
            Type: TransactionType.REFUND,
        },
        // Hidden state (should be filtered out)
        {
            ID: '3',
            State: TransactionState.NEEDS_ATTENTION,
            Type: TransactionType.PAYMENT,
        },
        // Hidden type (should be filtered out)
        {
            ID: '4',
            State: TransactionState.SUCCESS,
            Type: TransactionType.AUTHORIZATION,
        },
        // Both hidden (should be filtered out)
        {
            ID: '5',
            State: TransactionState.NEEDS_ATTENTION,
            Type: TransactionType.AUTHORIZATION,
        },
    ];

    const mockApiResponse = {
        Transactions: mockTransactions,
        Total: mockTransactions.length,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        addApiMock(queryTransactions({ Page: 0, PageSize: 10, Owner: INVOICE_OWNER.USER }).url, () => mockApiResponse);
    });

    it('should filter out transactions with hidden states or types', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useTransactions({ owner: INVOICE_OWNER.USER }), {
            wrapper,
        });

        // Initial state
        expect(result.current.transactions).toEqual([]);

        void result.current.request();

        // Wait for the API call to resolve
        await waitForNextUpdate();

        // Should only include visible transactions
        expect(result.current.transactions).toHaveLength(2);
        expect(result.current.transactions).toEqual([
            {
                ID: '1',
                State: TransactionState.SUCCESS,
                Type: TransactionType.PAYMENT,
            },
            {
                ID: '2',
                State: TransactionState.FAILURE,
                Type: TransactionType.REFUND,
            },
        ]);
    });

    it('should maintain the total count from the API response', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useTransactions({ owner: INVOICE_OWNER.USER }), {
            wrapper,
        });

        void result.current.request();
        await waitForNextUpdate();

        expect(result.current.total).toBe(mockTransactions.length);
    });

    it('should handle pagination', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useTransactions({ owner: INVOICE_OWNER.USER }), {
            wrapper,
        });

        void result.current.request();
        await waitForNextUpdate();

        // Mock API response for page 2
        addApiMock(queryTransactions({ Page: 1, PageSize: 10, Owner: INVOICE_OWNER.USER }).url, () => ({
            Transactions: [mockTransactions[0]], // Just one transaction for page 2
            Total: mockTransactions.length,
        }));

        // Change page
        act(() => {
            result.current.onSelect(2);
        });

        await waitForNextUpdate();

        expect(result.current.page).toBe(2);
        expect(result.current.transactions).toHaveLength(1);
    });
});

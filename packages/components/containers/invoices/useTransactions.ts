import { queryTransactions } from '@proton/payments/core/api/api';
import type { InvoiceOwner } from '@proton/payments/core/constants';
import type { Transaction, TransactionResponse } from '@proton/payments/core/interface';
import { displayTransactionState, displayTransactionType } from '@proton/payments/core/transactions';

import { usePaginationAsync } from '../../components/pagination';
import useApiResult from '../../hooks/useApiResult';
import type { DocumentHook } from './types';

export const ELEMENTS_PER_PAGE = 10;

export type TransactionsHook = DocumentHook & {
    type: 'transactions';
    transactions: Transaction[];
};

const useTransactions = ({ owner }: { owner: InvoiceOwner }): TransactionsHook => {
    const pagination = usePaginationAsync(1);
    const { page } = pagination;

    const {
        result = {
            Transactions: [] as Transaction[],
            Total: 0,
        },
        loading,
        request,
        error,
    } = useApiResult<TransactionResponse>(
        () =>
            queryTransactions({
                Page: page - 1,
                PageSize: ELEMENTS_PER_PAGE,
                Owner: owner,
            }),
        [page],
        false,
        true
    );

    return {
        ...pagination,
        transactions: result.Transactions.filter(
            ({ State, Type }) => displayTransactionState(State) && displayTransactionType(Type)
        ),
        total: result.Total,
        loading,
        request,
        error,
        type: 'transactions',
    };
};

export default useTransactions;

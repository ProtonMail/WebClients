import {
    type INVOICE_OWNER,
    type Transaction,
    type TransactionResponse,
    displayTransactionState,
    displayTransactionType,
} from '@proton/payments';
import { queryTransactions } from '@proton/shared/lib/api/payments';

import { usePaginationAsync } from '../../components/pagination';
import useApiResult from '../../hooks/useApiResult';
import { type DocumentHook } from './types';

export const ELEMENTS_PER_PAGE = 10;

export type TransactionsHook = DocumentHook & {
    type: 'transactions';
    transactions: Transaction[];
};

const useTransactions = ({ owner }: { owner: INVOICE_OWNER }): TransactionsHook => {
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

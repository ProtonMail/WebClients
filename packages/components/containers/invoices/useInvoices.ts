import { useCallback } from 'react';

import { type InvoiceDocument, queryInvoices } from '@proton/payments/core/api/api';
import type { InvoiceOwner } from '@proton/payments/core/constants';
import type { Invoice, InvoiceResponse } from '@proton/payments/core/interface';

import { usePaginationAsync } from '../../components/pagination';
import useApiResult from '../../hooks/useApiResult';
import type { DocumentHook } from './types';

export const ELEMENTS_PER_PAGE = 10;

export type InvoicesHook = DocumentHook & {
    type: 'invoices';
    invoices: Invoice[];
};

const useInvoices = ({ owner, Document }: { owner: InvoiceOwner; Document: InvoiceDocument }): InvoicesHook => {
    const pagination = usePaginationAsync(1);
    const { page } = pagination;

    const {
        result = {
            Invoices: [] as Invoice[],
            Total: 0,
        },
        loading,
        request,
        error,
    } = useApiResult<InvoiceResponse>(
        useCallback(
            () =>
                queryInvoices({
                    Page: page - 1,
                    PageSize: ELEMENTS_PER_PAGE,
                    Owner: owner,
                    Document,
                }),
            [page, owner, Document]
        ),
        [page],
        false,
        true
    );

    return {
        ...pagination,
        invoices: result.Invoices,
        total: result.Total,
        loading,
        request,
        error,
        type: 'invoices',
    };
};

export default useInvoices;

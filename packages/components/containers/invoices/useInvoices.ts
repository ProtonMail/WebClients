import { useCallback, useEffect } from 'react';

import type { Invoice, InvoiceOwner, InvoiceResponse } from '@proton/payments';
import { type InvoiceDocument, queryInvoices } from '@proton/payments';

import { usePaginationAsync } from '../../components/pagination';
import useApiResult from '../../hooks/useApiResult';
import { useReportRoutingError } from '../../payments/react-extensions/usePaymentsApi';
import { type DocumentHook } from './types';

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

    const reportRoutingError = useReportRoutingError();
    useEffect(() => {
        reportRoutingError(error, {
            flow: 'invoices',
        });
    }, [error]);

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

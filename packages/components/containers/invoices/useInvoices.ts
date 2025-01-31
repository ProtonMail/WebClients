import { useEffect } from 'react';

import type { INVOICE_OWNER, Invoice, InvoiceResponse } from '@proton/payments';
import type { InvoiceDocument, PaymentsVersion } from '@proton/shared/lib/api/payments';
import { queryInvoices } from '@proton/shared/lib/api/payments';

import { usePaginationAsync } from '../../components/pagination';
import useApiResult from '../../hooks/useApiResult';
import { useReportRoutingError } from '../../payments/react-extensions/usePaymentsApi';
import { type DocumentHook } from './types';

export const ELEMENTS_PER_PAGE = 10;

export type InvoicesHook = DocumentHook & {
    type: 'invoices';
    invoices: Invoice[];
};

const useInvoices = ({ owner, Document }: { owner: INVOICE_OWNER; Document: InvoiceDocument }): InvoicesHook => {
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
        (paymentsVersion?: PaymentsVersion) =>
            queryInvoices(
                {
                    Page: page - 1,
                    PageSize: ELEMENTS_PER_PAGE,
                    Owner: owner,
                    Document,
                },
                paymentsVersion
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

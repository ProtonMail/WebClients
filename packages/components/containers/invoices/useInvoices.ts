import { useEffect } from 'react';

import { InvoiceDocument, PaymentsVersion, queryInvoices } from '@proton/shared/lib/api/payments';
import { INVOICE_OWNER } from '@proton/shared/lib/constants';

import { usePaginationAsync } from '../../components/pagination';
import { Invoice, InvoiceResponse } from '../../containers/invoices/interface';
import { useApiResult } from '../../hooks';
import { useReportRoutingError } from '../../payments/react-extensions/usePaymentsApi';

export const ELEMENTS_PER_PAGE = 10;

const useInvoices = ({ owner, Document }: { owner: INVOICE_OWNER; Document: InvoiceDocument }) => {
    const pagination = usePaginationAsync(1);
    const { page } = pagination;

    const {
        result = {
            Invoices: [] as Invoice[],
            Total: 0,
        },
        loading,
        request: requestInvoices,
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
        requestInvoices,
        error,
    };
};

export default useInvoices;

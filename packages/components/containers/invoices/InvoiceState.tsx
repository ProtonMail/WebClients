import { c } from 'ttag';

import { INVOICE_STATE, type Invoice } from '@proton/payments';

import { Badge } from '../../components';

const TYPES = {
    [INVOICE_STATE.UNPAID]: 'error',
    [INVOICE_STATE.PAID]: 'success',
    [INVOICE_STATE.VOID]: 'default',
    [INVOICE_STATE.BILLED]: 'error',
    [INVOICE_STATE.WRITEOFF]: 'default',
} as const;

const getStatesI18N = (invoiceState: INVOICE_STATE) => {
    switch (invoiceState) {
        case INVOICE_STATE.UNPAID:
            return c('Invoice state display as badge').t`Unpaid`;
        case INVOICE_STATE.PAID:
            return c('Invoice state display as badge').t`Paid`;
        case INVOICE_STATE.VOID:
            return c('Invoice state display as badge').t`Void`;
        case INVOICE_STATE.BILLED:
            return c('Invoice state display as badge').t`Processing`;
        case INVOICE_STATE.WRITEOFF:
            return c('Invoice state display as badge').t`Gifted`;
        default:
            return '';
    }
};

interface Props {
    invoice: Invoice;
}

const InvoiceState = ({ invoice }: Props) => {
    return (
        <Badge type={TYPES[invoice.State] || 'default'} data-testid="invoice-state">
            {getStatesI18N(invoice.State)}
        </Badge>
    );
};

export default InvoiceState;

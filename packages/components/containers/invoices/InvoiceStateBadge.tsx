import { c } from 'ttag';

import { InvoiceState } from '@proton/payments/core/constants';
import type { Invoice } from '@proton/payments/core/interface';

import Badge from '../../components/badge/Badge';

const TYPES = {
    [InvoiceState.Unpaid]: 'error',
    [InvoiceState.Paid]: 'success',
    [InvoiceState.Void]: 'default',
    [InvoiceState.Billed]: 'origin',
    [InvoiceState.Writeoff]: 'default',
} as const;

const getStatesI18N = (invoiceState: InvoiceState) => {
    switch (invoiceState) {
        case InvoiceState.Unpaid:
            return c('Invoice state display as badge').t`Unpaid`;
        case InvoiceState.Paid:
            return c('Invoice state display as badge').t`Paid`;
        case InvoiceState.Void:
            return c('Invoice state display as badge').t`Void`;
        case InvoiceState.Billed:
            return c('Invoice state display as badge').t`Processing`;
        case InvoiceState.Writeoff:
            return c('Invoice state display as badge').t`Gifted`;
        default:
            return '';
    }
};

interface Props {
    invoice: Invoice;
}

const InvoiceStateBadge = ({ invoice }: Props) => {
    return (
        <Badge type={TYPES[invoice.State] || 'default'} data-testid="invoice-state">
            {getStatesI18N(invoice.State)}
        </Badge>
    );
};

export default InvoiceStateBadge;

import React from 'react';
import { c } from 'ttag';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import { Badge } from '../../components';
import { Invoice } from './interface';

const TYPES = {
    [INVOICE_STATE.UNPAID]: 'error',
    [INVOICE_STATE.PAID]: 'success',
    [INVOICE_STATE.VOID]: 'default',
    [INVOICE_STATE.BILLED]: 'default',
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
            return c('Invoice state display as badge').t`Billed`;
        case INVOICE_STATE.WRITEOFF:
            return c('Invoice state display as badge').t`Writeoff`;
        default:
            return '';
    }
};

interface Props {
    invoice: Invoice;
}

const InvoiceState = ({ invoice }: Props) => {
    return <Badge type={TYPES[invoice.State] || 'default'}>{getStatesI18N(invoice.State)}</Badge>;
};

export default InvoiceState;

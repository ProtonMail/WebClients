import React from 'react';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import { Price } from '../../components';
import { Invoice } from './interface';

interface Props {
    invoice: Invoice;
}

const format = ({ State, AmountCharged = 0, AmountDue = 0 }: Invoice) => {
    return State === INVOICE_STATE.UNPAID ? AmountDue : AmountCharged;
};

const InvoiceAmount = ({ invoice }: Props) => {
    return <Price currency={invoice.Currency}>{format(invoice)}</Price>;
};

export default InvoiceAmount;

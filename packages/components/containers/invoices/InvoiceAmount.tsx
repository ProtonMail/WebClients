import { INVOICE_STATE, type Invoice } from '@proton/payments';

import { Price } from '../../components';

interface Props {
    invoice: Invoice;
}

const format = ({ State, AmountCharged = 0, AmountDue = 0 }: Invoice) => {
    return State === INVOICE_STATE.UNPAID || State === INVOICE_STATE.BILLED ? AmountDue : AmountCharged;
};

const InvoiceAmount = ({ invoice }: Props) => {
    return (
        <Price currency={invoice.Currency} data-testid="invoice-amount">
            {format(invoice)}
        </Price>
    );
};

export default InvoiceAmount;

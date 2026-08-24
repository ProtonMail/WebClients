import { InvoiceState } from '@proton/payments/core/constants';
import type { Invoice } from '@proton/payments/core/interface';

import Price from '../../components/price/Price';

interface Props {
    invoice: Invoice;
}

const format = ({ State, AmountCharged = 0, AmountDue = 0 }: Invoice) => {
    return State === InvoiceState.Unpaid || State === InvoiceState.Billed ? AmountDue : AmountCharged;
};

const InvoiceAmount = ({ invoice }: Props) => {
    return (
        <Price currency={invoice.Currency} data-testid="invoice-amount">
            {format(invoice)}
        </Price>
    );
};

export default InvoiceAmount;

import Price from '@proton/components/components/price/Price';
import type { Invoice } from '@proton/payments';
import { INVOICE_STATE } from '@proton/payments';

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

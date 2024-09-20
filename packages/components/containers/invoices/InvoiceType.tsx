import { c } from 'ttag';

import { INVOICE_TYPE, type Invoice, isCreditNoteInvoice } from '@proton/payments';

const getType = (invoice: Invoice) => {
    const type: INVOICE_TYPE = invoice.Type;

    switch (type) {
        case INVOICE_TYPE.OTHER:
            return c('Invoice type display as badge').t`Other`;
        case INVOICE_TYPE.SUBSCRIPTION:
            return c('Invoice type display as badge').t`Subscription`;
        case INVOICE_TYPE.CANCELLATION:
            return c('Invoice type display as badge').t`Cancellation`;
        case INVOICE_TYPE.CREDIT:
            if (isCreditNoteInvoice(invoice)) {
                // Credit Note is a system generated note that might occur as a middle step e.g. in currency conversion
                return c('Invoice type display as badge').t`Credit note`;
            }

            // "Credit" is when user buys credit explicitly, e.g. with Top Up
            return c('Invoice type display as badge').t`Credit`;
        case INVOICE_TYPE.DONATION:
            return c('Invoice type display as badge').t`Donation`;
        case INVOICE_TYPE.CHARGEBACK:
            return c('Invoice type display as badge').t`Chargeback`;
        case INVOICE_TYPE.RENEWAL:
            return c('Invoice type display as badge').t`Renewal`;
        case INVOICE_TYPE.REFUND:
            return c('Invoice type display as badge').t`Refund`;
        case INVOICE_TYPE.MODIFICATION:
            return c('Invoice type display as badge').t`Modification`;
        case INVOICE_TYPE.ADDITION:
            return c('Invoice type display as badge').t`Addition`;
        case INVOICE_TYPE.CURRENCY_CONVERSION:
            return c('Invoice type display as badge').t`Currency conversion`;
        default:
            return '';
    }
};

interface Props {
    invoice: Invoice;
}

const InvoiceType = ({ invoice }: Props) => {
    return <>{getType(invoice)}</>;
};

export default InvoiceType;

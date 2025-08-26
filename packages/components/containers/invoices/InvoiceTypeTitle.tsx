import { c } from 'ttag';

import { type Invoice, InvoiceType, isCreditNoteInvoice } from '@proton/payments';

const getType = (invoice: Invoice) => {
    const type: InvoiceType = invoice.Type;

    switch (type) {
        case InvoiceType.Other:
            return c('Invoice type display as badge').t`Other`;
        case InvoiceType.Subscription:
            return c('Invoice type display as badge').t`Subscription`;
        case InvoiceType.Cancellation:
            return c('Invoice type display as badge').t`Cancellation`;
        case InvoiceType.Credit:
            if (isCreditNoteInvoice(invoice)) {
                // Credit Note is a system generated note that might occur as a middle step e.g. in currency conversion
                return c('Invoice type display as badge').t`Credit note`;
            }

            // "Credit" is when user buys credit explicitly, e.g. with Top Up
            return c('Invoice type display as badge').t`Credit`;
        case InvoiceType.Donation:
            return c('Invoice type display as badge').t`Donation`;
        case InvoiceType.Chargeback:
            return c('Invoice type display as badge').t`Chargeback`;
        case InvoiceType.Renewal:
            return c('Invoice type display as badge').t`Renewal`;
        case InvoiceType.Refund:
            return c('Invoice type display as badge').t`Refund`;
        case InvoiceType.Modification:
            return c('Invoice type display as badge').t`Modification`;
        case InvoiceType.Addition:
            return c('Invoice type display as badge').t`Addition`;
        case InvoiceType.CurrencyConversion:
            return c('Invoice type display as badge').t`Currency conversion`;
        case InvoiceType.Product:
            return c('Invoice type display as badge').t`Product`;
        case InvoiceType.Manual:
            return c('Invoice type display as badge').t`Manual`;
        default:
            return '';
    }
};

interface Props {
    invoice: Invoice;
}

const InvoiceTypeTitle = ({ invoice }: Props) => {
    return <>{getType(invoice)}</>;
};

export default InvoiceTypeTitle;

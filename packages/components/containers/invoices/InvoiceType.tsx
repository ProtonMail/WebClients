import { c } from 'ttag';
import { INVOICE_TYPE } from '@proton/shared/lib/constants';
import { Invoice } from './interface';

const getType = (type: INVOICE_TYPE) => {
    switch (type) {
        case INVOICE_TYPE.OTHER:
            return c('Invoice type display as badge').t`Other`;
        case INVOICE_TYPE.SUBSCRIPTION:
            return c('Invoice type display as badge').t`Subscription`;
        case INVOICE_TYPE.CANCELLATION:
            return c('Invoice type display as badge').t`Cancellation`;
        case INVOICE_TYPE.CREDIT:
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
        default:
            return '';
    }
};

interface Props {
    invoice: Invoice;
}

const InvoiceType = ({ invoice }: Props) => {
    return getType(invoice.Type);
};

export default InvoiceType;

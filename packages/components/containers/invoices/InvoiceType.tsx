import { c } from 'ttag';

import { INVOICE_TYPE } from '@proton/shared/lib/constants';
import { ChargebeeEnabled, UserModel } from '@proton/shared/lib/interfaces';

import { Invoice } from './interface';

const getType = (type: INVOICE_TYPE, chargebeeUser?: ChargebeeEnabled) => {
    switch (type) {
        case INVOICE_TYPE.OTHER:
            return c('Invoice type display as badge').t`Other`;
        case INVOICE_TYPE.SUBSCRIPTION:
            return c('Invoice type display as badge').t`Subscription`;
        case INVOICE_TYPE.CANCELLATION:
            return c('Invoice type display as badge').t`Cancellation`;
        case INVOICE_TYPE.CREDIT:
            if (chargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED) {
                return c('Invoice type display as badge').t`Credit note`;
            }
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
    user?: UserModel;
}

const InvoiceType = ({ invoice, user }: Props) => {
    return <>{getType(invoice.Type, user?.ChargebeeUser)}</>;
};

export default InvoiceType;

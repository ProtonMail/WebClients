import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_TYPE } from 'proton-shared/lib/constants';

const InvoiceType = ({ invoice }) => {
    const TYPES = {
        [INVOICE_TYPE.OTHER]: c('Invoice type display as badge').t`Other`,
        [INVOICE_TYPE.SUBSCRIPTION]: c('Invoice type display as badge').t`Subscription`,
        [INVOICE_TYPE.CANCELLATION]: c('Invoice type display as badge').t`Cancellation`,
        [INVOICE_TYPE.CREDIT]: c('Invoice type display as badge').t`Credit`,
        [INVOICE_TYPE.DONATION]: c('Invoice type display as badge').t`Donation`,
        [INVOICE_TYPE.CHARGEBACK]: c('Invoice type display as badge').t`Chargeback`,
        [INVOICE_TYPE.RENEWAL]: c('Invoice type display as badge').t`Renewal`,
        [INVOICE_TYPE.REFUND]: c('Invoice type display as badge').t`Refund`,
        [INVOICE_TYPE.MODIFICATION]: c('Invoice type display as badge').t`Modification`,
        [INVOICE_TYPE.ADDITION]: c('Invoice type display as badge').t`Addition`
    };

    return TYPES[invoice.Type];
};

InvoiceType.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default InvoiceType;

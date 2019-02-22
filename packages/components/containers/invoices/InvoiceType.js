import React from 'react';
import { Badge } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_TYPE } from 'proton-shared/lib/constants';

const InvoiceType = ({ invoice }) => {
    const TYPES = {
        [INVOICE_TYPE.OTHER]: c('Invoice type display as badge').t`Other`,
        [INVOICE_TYPE.SUBSCRIPTION]: c('Invoice type display as badge').t`Subscription`,
        [INVOICE_TYPE.CANCELLATION]: c('Invoice type display as badge').t`Cancellation`,
        [INVOICE_TYPE.CREDIT]: c('Invoice type display as badge').t`Credit`,
        [INVOICE_TYPE.DONATION]: c('Invoice type display as badge').t`Donation`
    };

    return <Badge>{TYPES[invoice.Type]}</Badge>;
};

InvoiceType.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default InvoiceType;
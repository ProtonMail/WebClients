import React from 'react';
import { Badge } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';

const InvoiceState = ({ invoice }) => {
    const STATES = {
        [INVOICE_STATE.UNPAID]: c('Invoice state display as badge').t`Unpaid`,
        [INVOICE_STATE.PAID]: c('Invoice state display as badge').t`Paid`,
        [INVOICE_STATE.VOID]: c('Invoice state display as badge').t`Void`,
        [INVOICE_STATE.BILLED]: c('Invoice state display as badge').t`Billed`
    };

    return <Badge>{STATES[invoice.State]}</Badge>;
};

InvoiceState.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default InvoiceState;
import React from 'react';
import { Badge } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';

const TYPES = {
    [INVOICE_STATE.UNPAID]: 'error',
    [INVOICE_STATE.PAID]: 'success',
    [INVOICE_STATE.VOID]: 'default',
    [INVOICE_STATE.BILLED]: 'default',
    [INVOICE_STATE.WRITEOFF]: 'default'
};

const getStatesI18N = () => ({
    [INVOICE_STATE.UNPAID]: c('Invoice state display as badge').t`Unpaid`,
    [INVOICE_STATE.PAID]: c('Invoice state display as badge').t`Paid`,
    [INVOICE_STATE.VOID]: c('Invoice state display as badge').t`Void`,
    [INVOICE_STATE.BILLED]: c('Invoice state display as badge').t`Billed`,
    [INVOICE_STATE.WRITEOFF]: c('Invoice state display as badge').t`Writeoff`
});

const InvoiceState = ({ invoice }) => {
    const i18n = getStatesI18N();

    return <Badge type={TYPES[invoice.State]}>{i18n[invoice.State]}</Badge>;
};

InvoiceState.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default InvoiceState;

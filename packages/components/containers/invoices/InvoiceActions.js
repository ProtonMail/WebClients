import React from 'react';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';

import DownloadInvoiceButton from './DownloadInvoiceButton';
import PayButton from './PayButton';

const InvoiceActions = ({ invoice, onChange }) => {
    return (
        <>
            <DownloadInvoiceButton invoice={invoice} />
            {invoice.State === INVOICE_STATE.UNPAID ? <PayButton invoice={invoice} onChange={onChange} /> : null}
        </>
    );
};

InvoiceActions.propTypes = {
    invoice: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default InvoiceActions;

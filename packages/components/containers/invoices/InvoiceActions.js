import React from 'react';
import { SmallButton, useApi } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { getInvoice } from 'proton-shared/lib/api/payments';

const InvoiceActions = ({ invoice: { State, ID } }) => {
    const { loading, request } = useApi(getInvoice);

    const handleDownload = async () => {
        const buffer = await request(ID);
        const filename = c('Title for PDF file').t`ProtonMail invoice` + ` ${ID}.pdf`;
        const blob = new Blob([buffer], { type: 'application/pdf' });

        downloadFile(blob, filename);
    };

    const handlePay = () => {};

    return (
        <>
            <SmallButton onClick={handleDownload} disabled={loading}>{c('Action').t`Download`}</SmallButton>
            {State === INVOICE_STATE.UNPAID ? (
                <SmallButton onClick={handlePay}>{c('Action').t`Pay`}</SmallButton>
            ) : null}
        </>
    );
};

InvoiceActions.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default InvoiceActions;

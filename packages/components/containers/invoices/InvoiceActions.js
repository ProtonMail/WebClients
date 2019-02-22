import React, { useContext } from 'react';
import { SmallButton } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import ContextApi from 'proton-shared/lib/context/api';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { getInvoice } from 'proton-shared/lib/api/payments';

const InvoiceActions = ({ invoice }) => {
    const { api } = useContext(ContextApi);
    const { ID } = invoice;

    const handleDownload = async () => {
        const buffer = await api(getInvoice(ID));
        const filename = c('Title for PDF file').t`ProtonMail invoice` + ` ${ID}.pdf`;
        const blob = new Blob([buffer], { type: 'application/pdf' });

        downloadFile(blob, filename);
    };

    const handlePay = () => {

    };

    return (
        <>
            <SmallButton onClick={handleDownload}>{c('Action').t`Download`}</SmallButton>
            {invoice.State === INVOICE_STATE.UNPAID ? <SmallButton onClick={handlePay}>{c('Action').t`Pay`}</SmallButton> : null}
        </>
    );
};

InvoiceActions.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default InvoiceActions;
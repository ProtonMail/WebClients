import React from 'react';
import { SmallButton, useApiWithoutResult } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { getInvoice } from 'proton-shared/lib/api/payments';

const DownloadInvoiceButton = ({ invoice }) => {
    const { loading, request } = useApiWithoutResult(getInvoice);

    const handleClick = async () => {
        const buffer = await request(invoice.ID);
        const filename = c('Title for PDF file').t`ProtonMail invoice` + ` ${invoice.ID}.pdf`;
        const blob = new Blob([buffer], { type: 'application/pdf' });

        downloadFile(blob, filename);
    };

    return <SmallButton onClick={handleClick} disabled={loading}>{c('Action').t`Download`}</SmallButton>;
};

DownloadInvoiceButton.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default DownloadInvoiceButton;

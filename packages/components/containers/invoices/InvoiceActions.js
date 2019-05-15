import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import { DropdownActions, useApiWithoutResult, useModal, useNotifications, PreviewPDFModal } from 'react-components';
import { getInvoice, getPaymentMethodStatus } from 'proton-shared/lib/api/payments';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

import PayInvoiceModal from './PayInvoiceModal';

const InvoiceActions = ({ invoice, fetchInvoices }) => {
    const [url, setUrl] = useState();
    const filename = c('Title for PDF file').t`ProtonMail invoice` + ` ${invoice.ID}.pdf`;
    const { isOpen: showPayInvoiceModal, open: openPayInvoiceModal, close: closePayInvoiceModal } = useModal();
    const {
        isOpen: showPreviewInvoiceModal,
        open: openPreviewInvoiceModal,
        close: closePreviewInvoiceModal
    } = useModal();
    const { request: requestGetInvoice } = useApiWithoutResult(getInvoice);
    const { createNotification } = useNotifications();
    const { request: requestGetPaymentMethodStatus } = useApiWithoutResult(getPaymentMethodStatus);

    const get = async () => {
        const buffer = await requestGetInvoice(invoice.ID);
        return new Blob([buffer], { type: 'application/pdf' });
    };

    const list = [
        {
            text: c('Action').t`View`,
            async onClick() {
                const blob = await get();
                setUrl(URL.createObjectURL(blob));
                openPreviewInvoiceModal();
            }
        },
        {
            text: c('Action').t`Download`,
            async onClick() {
                const blob = await get();
                downloadFile(blob, filename);
            }
        },
        invoice.State === INVOICE_STATE.UNPAID && {
            text: c('Action').t`Pay`,
            async onClick() {
                const { Stripe, Paymentwall } = await requestGetPaymentMethodStatus();
                const canPay = Stripe || Paymentwall;

                if (!canPay) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Payments are currently not available, please try again later`
                    });
                }

                openPayInvoiceModal();
            }
        }
    ].filter(Boolean);

    return (
        <>
            <DropdownActions list={list} className="pm-button--small" />
            {showPreviewInvoiceModal ? (
                <PreviewPDFModal
                    onClose={closePreviewInvoiceModal}
                    url={url}
                    title={c('Title').t`Preview invoice`}
                    filename={filename}
                />
            ) : null}
            {invoice.State === INVOICE_STATE.UNPAID ? (
                showPayInvoiceModal ? (
                    <PayInvoiceModal invoice={invoice} onClose={closePayInvoiceModal} fetchInvoices={fetchInvoices} />
                ) : null
            ) : null}
        </>
    );
};

InvoiceActions.propTypes = {
    invoice: PropTypes.object.isRequired,
    fetchInvoices: PropTypes.func.isRequired
};

export default InvoiceActions;

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
            type: 'button',
            async onClick() {
                const blob = await get();
                setUrl(URL.createObjectURL(blob));
                openPreviewInvoiceModal();
            }
        },
        {
            text: c('Action').t`Download`,
            type: 'button',
            async onClick() {
                const blob = await get();
                downloadFile(blob, filename);
            }
        }
    ];

    if (invoice.State === INVOICE_STATE.UNPAID) {
        list.unshift({
            text: c('Action').t`Pay`,
            type: 'button',
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
        });
    }

    return (
        <>
            <DropdownActions list={list} className="pm-button--small" />
            <PreviewPDFModal
                show={showPreviewInvoiceModal}
                onClose={closePreviewInvoiceModal}
                url={url}
                title={c('Title').t`Preview invoice`}
                filename={filename}
            />
            {invoice.State === INVOICE_STATE.UNPAID ? (
                <PayInvoiceModal
                    invoice={invoice}
                    show={showPayInvoiceModal}
                    onClose={closePayInvoiceModal}
                    fetchInvoices={fetchInvoices}
                />
            ) : null}
        </>
    );
};

InvoiceActions.propTypes = {
    invoice: PropTypes.object.isRequired,
    fetchInvoices: PropTypes.func.isRequired
};

export default InvoiceActions;

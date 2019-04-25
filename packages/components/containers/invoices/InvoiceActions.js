import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import { DropdownActions, useApiWithoutResult, useModal, useNotifications } from 'react-components';
import { getInvoice, getPaymentMethodStatus } from 'proton-shared/lib/api/payments';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { hasPDFSupport } from 'proton-shared/lib/helpers/browser';

import PayInvoiceModal from './PayInvoiceModal';
import PreviewInvoiceModal from './PreviewInvoiceModal';

const InvoiceActions = ({ invoice, fetchInvoices }) => {
    const { isOpen: showPayInvoiceModal, open: openPayInvoiceModal, close: closePayInvoiceModal } = useModal();
    const {
        isOpen: showPreviewInvoiceModal,
        open: openPreviewInvoiceModal,
        close: closePreviewInvoiceModal
    } = useModal();
    const { request: requestGetInvoice } = useApiWithoutResult(getInvoice);
    const { createNotification } = useNotifications();
    const { request: requestGetPaymentMethodStatus } = useApiWithoutResult(getPaymentMethodStatus);

    const list = [
        {
            text: c('Action').t`Download`,
            type: 'button',
            async onClick() {
                const buffer = await requestGetInvoice(invoice.ID);
                const filename = c('Title for PDF file').t`ProtonMail invoice` + ` ${invoice.ID}.pdf`;
                const blob = new Blob([buffer], { type: 'application/pdf' });

                downloadFile(blob, filename);
            }
        }
    ];

    if (hasPDFSupport()) {
        list.unshift({
            text: c('Action').t`View`,
            type: 'button',
            onClick: openPreviewInvoiceModal
        });
    }

    if (invoice.State === INVOICE_STATE.UNPAID) {
        list.push({
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
            <PreviewInvoiceModal show={showPreviewInvoiceModal} onClose={closePreviewInvoiceModal} invoice={invoice} />
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

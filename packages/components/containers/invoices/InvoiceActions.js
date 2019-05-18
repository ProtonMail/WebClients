import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import { DropdownActions, useApi, useModals, useNotifications, PreviewPDFModal } from 'react-components';
import { getInvoice, getPaymentMethodStatus } from 'proton-shared/lib/api/payments';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

import PayInvoiceModal from './PayInvoiceModal';

const InvoiceActions = ({ invoice, fetchInvoices }) => {
    const [url, setUrl] = useState();
    const filename = c('Title for PDF file').t`ProtonMail invoice` + ` ${invoice.ID}.pdf`;
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const api = useApi();

    const get = async () => {
        const buffer = await api(getInvoice(invoice.ID));
        return new Blob([buffer], { type: 'application/pdf' });
    };

    const list = [
        {
            text: c('Action').t`View`,
            async onClick() {
                const blob = await get();
                setUrl(URL.createObjectURL(blob));

                createModal(<PreviewPDFModal url={url} title={c('Title').t`Preview invoice`} filename={filename} />);
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
                const { Stripe, Paymentwall } = await api(getPaymentMethodStatus());
                const canPay = Stripe || Paymentwall;

                if (!canPay) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Payments are currently not available, please try again later`
                    });
                }

                createModal(<PayInvoiceModal invoice={invoice} fetchInvoices={fetchInvoices} />);
            }
        }
    ].filter(Boolean);

    return <DropdownActions list={list} className="pm-button--small" />;
};

InvoiceActions.propTypes = {
    invoice: PropTypes.object.isRequired,
    fetchInvoices: PropTypes.func.isRequired
};

export default InvoiceActions;

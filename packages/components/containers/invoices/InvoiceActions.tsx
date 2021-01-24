import React from 'react';
import { c } from 'ttag';
import { INVOICE_STATE } from 'proton-shared/lib/constants';
import { getInvoice, getPaymentMethodStatus } from 'proton-shared/lib/api/payments';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { DropdownActions, PreviewPDFModal } from '../../components';
import { useApi, useLoading, useModals, useNotifications } from '../../hooks';
import PayInvoiceModal from './PayInvoiceModal';
import { Invoice } from './interface';

interface Props {
    invoice: Invoice;
    fetchInvoices: () => void;
}

const InvoiceActions = ({ invoice, fetchInvoices }: Props) => {
    const filename = `${c('Title for PDF file').t`ProtonMail invoice`} ${invoice.ID}.pdf`;
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const getInvoiceBlob = async () => {
        const buffer = await api<ArrayBuffer>(getInvoice(invoice.ID));
        return new Blob([buffer], { type: 'application/pdf' });
    };

    const list = [
        invoice.State === INVOICE_STATE.UNPAID && {
            text: c('Action').t`Pay`,
            async onClick() {
                const { Stripe, Paymentwall } = await api(getPaymentMethodStatus());
                const canPay = Stripe || Paymentwall;

                if (!canPay) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Payments are currently not available, please try again later`,
                    });
                }

                createModal(<PayInvoiceModal invoice={invoice} fetchInvoices={fetchInvoices} />);
            },
        },
        {
            text: c('Action').t`View`,
            onClick: () => {
                const handler = async () => {
                    const blob = await getInvoiceBlob();

                    createModal(
                        <PreviewPDFModal
                            url={URL.createObjectURL(blob)}
                            title={c('Title').t`Preview invoice`}
                            filename={filename}
                        />
                    );
                };
                withLoading(handler());
            },
        },
        {
            text: c('Action').t`Download`,
            onClick: () => {
                const handler = async () => {
                    const blob = await getInvoiceBlob();
                    downloadFile(blob, filename);
                };
                withLoading(handler());
            },
        },
    ].filter(isTruthy);

    return <DropdownActions loading={loading} list={list} className="pm-button--small" />;
};

export default InvoiceActions;

import { c } from 'ttag';

import { getPaymentMethodStatus } from '@proton/shared/lib/api/payments';
import { INVOICE_STATE } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions } from '../../components';
import { useApi, useLoading, useModals, useNotifications } from '../../hooks';
import PayInvoiceModal from './PayInvoiceModal';
import { Invoice } from './interface';

interface Props {
    invoice: Invoice;
    fetchInvoices: () => void;
    onPreview: (invoice: Invoice) => void;
    onDownload: (invoice: Invoice) => void;
}

const InvoiceActions = ({ invoice, fetchInvoices, onPreview, onDownload }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [downloadLoading, withDownloadLoading] = useLoading();
    const [viewLoading, withViewLoading] = useLoading();

    const list = [
        invoice.State === INVOICE_STATE.UNPAID && {
            text: c('Action').t`Pay`,
            async onClick() {
                const { Card, Paypal } = await api(getPaymentMethodStatus());
                const canPay = Card || Paypal;

                if (!canPay) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Payments are currently not available, please try again later`,
                    });
                    return;
                }

                createModal(<PayInvoiceModal invoice={invoice} fetchInvoices={fetchInvoices} />);
            },
        },
        {
            text: c('Action').t`View`,
            onClick: async () => {
                const handler = async () => {
                    onPreview(invoice);
                };
                await withViewLoading(handler());
            },
            loading: viewLoading,
        },
        {
            text: c('Action').t`Download`,
            onClick: async () => {
                const handler = async () => {
                    onDownload(invoice);
                };
                await withDownloadLoading(handler());
            },
            loading: downloadLoading,
        },
    ].filter(isTruthy);

    return <DropdownActions loading={Boolean(downloadLoading || viewLoading)} list={list} size="small" />;
};

export default InvoiceActions;

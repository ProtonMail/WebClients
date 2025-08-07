import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useModals from '@proton/components/hooks/useModals';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { INVOICE_STATE, type Invoice, isRegularInvoice } from '@proton/payments';
import isTruthy from '@proton/utils/isTruthy';

import { useRedirectToAccountApp } from '../desktop/useRedirectToAccountApp';
import PayInvoiceModal from './PayInvoiceModal';

interface Props {
    invoice: Invoice;
    fetchInvoices: () => void;
    onPreview?: (invoice: Invoice) => void;
    onDownload: (invoice: Invoice) => void;
    onEdit: (invoice: Invoice) => Promise<void>;
}

const InvoiceActions = ({ invoice, fetchInvoices, onPreview, onDownload, onEdit }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { paymentsApi } = usePaymentsApi();
    const [downloadLoading, withDownloadLoading] = useLoading();
    const [viewLoading, withViewLoading] = useLoading();
    const [editLoading, withEditLoading] = useLoading();
    const redirectToAccountApp = useRedirectToAccountApp();

    const list = [
        invoice.State === INVOICE_STATE.UNPAID && {
            text: c('Action').t`Pay`,
            'data-testid': 'payInvoice',
            key: 'payInvoice',
            async onClick() {
                if (redirectToAccountApp()) {
                    return;
                }

                const status = await paymentsApi.paymentStatus();
                const canPay = status.VendorStates.Card || status.VendorStates.Paypal;

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
            'data-testid': 'viewInvoice',
            key: 'viewInvoice',
            onClick: async () => {
                const handler = async () => {
                    onPreview?.(invoice);
                };
                await withViewLoading(handler());
            },
            loading: viewLoading,
        },
        {
            text: c('Action').t`Download`,
            'data-testid': 'downloadInvoice',
            key: 'downloadInvoice',
            onClick: async () => {
                const handler = async () => {
                    onDownload(invoice);
                };
                await withDownloadLoading(handler());
            },
            loading: downloadLoading,
        },
        !!invoice.IsExternal &&
            isRegularInvoice(invoice) && {
                text: c('Action').t`Edit billing address`,
                'data-testid': 'editBillingAddress',
                key: 'editBillingAddress',
                onClick: () => withEditLoading(onEdit(invoice)),
                loading: editLoading,
            },
    ].filter(isTruthy);

    return <DropdownActions loading={Boolean(downloadLoading || viewLoading)} list={list} size="small" />;
};

export default InvoiceActions;

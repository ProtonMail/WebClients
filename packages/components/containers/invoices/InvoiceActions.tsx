import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { INVOICE_STATE } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { useModals, useNotifications } from '../../hooks';
import { useRedirectToAccountApp } from '../desktop/useRedirectToAccountApp';
import PayInvoiceModal from './PayInvoiceModal';
import type { Invoice } from './interface';

interface Props {
    invoice: Invoice;
    fetchInvoices: () => void;
    onPreview?: (invoice: Invoice) => void;
    onDownload: (invoice: Invoice) => void;
}

const InvoiceActions = ({ invoice, fetchInvoices, onPreview, onDownload }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { paymentsApi } = usePaymentsApi();
    const [downloadLoading, withDownloadLoading] = useLoading();
    const [viewLoading, withViewLoading] = useLoading();
    const redirectToAccountApp = useRedirectToAccountApp();

    const list = [
        invoice.State === INVOICE_STATE.UNPAID && {
            text: c('Action').t`Pay`,
            'data-testid': 'payInvoice',
            async onClick() {
                if (redirectToAccountApp()) {
                    return;
                }

                const status = await paymentsApi.statusExtendedAutomatic();
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

import { c } from 'ttag';

import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import type { FullBillingAddress, Invoice } from '@proton/payments';

import type { EditInvoiceModalInputs } from './EditInvoiceModal';
import { EditInvoiceModal } from './EditInvoiceModal';

export class FetchBillingAddressError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FetchBillingAddressError';
    }
}

export const useEditInvoiceModal = () => {
    const [editInvoiceModal, showEditBillingAddressModal] = useModalTwoPromise<EditInvoiceModalInputs>(() => ({
        // Technically type casting isn't safe here, but practically speaking openBillingAddressModal ensures that these
        // properties are set correctly before the modal is shown.
        initialInvoiceBillingAddress: {} as FullBillingAddress,
        initialFullBillingAddress: {} as FullBillingAddress,
        invoice: {} as Invoice,
    }));

    const { paymentsApi } = usePaymentsApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const fetchBillingAddresses = async (
        props: Pick<EditInvoiceModalInputs, 'invoice'>
    ): Promise<{
        fullBillingAddress: FullBillingAddress;
        invoiceBillingAddress: FullBillingAddress;
    }> => {
        try {
            const [invoiceBillingAddress, fullBillingAddress] = await Promise.all([
                paymentsApi.getInvoiceBillingAddress(props.invoice.ID),
                paymentsApi.getFullBillingAddress(),
            ]);
            return { invoiceBillingAddress, fullBillingAddress };
        } catch (error) {
            createNotification({
                type: 'error',
                text: c('Error').t`Editing billing address is not available at the moment. Please try again later.`,
            });
            return Promise.reject(error);
        }
    };

    const openEditInvoiceModal = async (props: Pick<EditInvoiceModalInputs, 'invoice'>): Promise<void> => {
        let initialInvoiceBillingAddress: FullBillingAddress;
        let initialFullBillingAddress: FullBillingAddress;
        try {
            const promise = fetchBillingAddresses(props);
            void withLoading(promise);
            const { invoiceBillingAddress, fullBillingAddress } = await promise;
            initialInvoiceBillingAddress = invoiceBillingAddress;
            initialFullBillingAddress = fullBillingAddress;
        } catch (error) {
            return Promise.reject(error);
        }

        return showEditBillingAddressModal({
            ...props,
            initialInvoiceBillingAddress,
            initialFullBillingAddress,
        });
    };

    return {
        editInvoiceModal: editInvoiceModal((props) => {
            return <EditInvoiceModal {...props} />;
        }),
        openEditInvoiceModal,
        loading,
    };
};

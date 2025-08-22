import { c } from 'ttag';

import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import { type FullBillingAddress } from '@proton/payments';

import type { EditBillingAddressModalFullInputs } from './EditBillingAddressModal';
import InvoiceTextNewModal, { type EditBillingAdressModalInputs } from './EditBillingAddressModal';

export class FetchBillingAddressError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FetchBillingAddressError';
    }
}

export const useEditBillingAddressModal = () => {
    const [editBillingAddressModal, showEditBillingAddressModal] =
        useModalTwoPromise<EditBillingAddressModalFullInputs>(() => ({
            editExistingInvoice: false,
            initialFullBillingAddress: {} as FullBillingAddress,
        }));

    const { paymentsApi: defaultPaymentsApi } = usePaymentsApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const fetchBillingAddress = async (props: EditBillingAdressModalInputs) => {
        try {
            const paymentsApi = props.paymentsApi ?? defaultPaymentsApi;

            if (props.editExistingInvoice) {
                return await paymentsApi.getInvoiceBillingAddress(props.invoice.ID);
            } else {
                return await paymentsApi.getFullBillingAddress();
            }
        } catch (error) {
            createNotification({
                type: 'error',
                text: c('Error').t`Editing billing address is not available at the moment. Please try again later.`,
            });
            return Promise.reject(error);
        }
    };

    const openBillingAddressModal = async (props: EditBillingAdressModalInputs): Promise<void> => {
        let fullBillingAddressBackend: FullBillingAddress;
        try {
            const promise = fetchBillingAddress(props);
            withLoading(promise);
            fullBillingAddressBackend = await promise;
        } catch (error) {
            return Promise.reject(error);
        }

        const initialFullBillingAddress = {
            ...fullBillingAddressBackend,
            ...props.initialFullBillingAddress,
        };

        return showEditBillingAddressModal({
            ...props,
            initialFullBillingAddress,
        });
    };

    return {
        editBillingAddressModal: editBillingAddressModal((props) => {
            return <InvoiceTextNewModal {...props} />;
        }),
        openBillingAddressModal,
        loading,
    };
};

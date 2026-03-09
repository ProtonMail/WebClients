import { c } from 'ttag';

import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoadingByKey } from '@proton/hooks/useLoading';

import type { FullBillingAddress } from '../../../core/billing-address/billing-address';
import { EditBillingAddressModal, type EditBillingAdressModalInputs } from './EditBillingAddress';

export class FetchBillingAddressError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FetchBillingAddressError';
    }
}

export const useEditBillingAddressModal = () => {
    const [editBillingAddressModal, showEditBillingAddressModal] = useModalTwoPromise<
        EditBillingAdressModalInputs,
        FullBillingAddress
    >(() => ({
        // Technically type casting isn't safe here, but practically speaking openBillingAddressModal ensures that these
        // properties are set correctly before the modal is shown.
        initialFullBillingAddress: {} as FullBillingAddress,
        subscription: undefined,
    }));

    const { paymentsApi: defaultPaymentsApi } = usePaymentsApi();
    const { createNotification } = useNotifications();
    const [loadingByKey, withLoadingByKey] = useLoadingByKey();

    const fetchBillingAddress = async (props?: Partial<EditBillingAdressModalInputs>) => {
        try {
            const paymentsApi = props?.paymentsApi ?? defaultPaymentsApi;
            return await paymentsApi.getFullBillingAddress();
        } catch (error) {
            createNotification({
                type: 'error',
                text: c('Error').t`Editing billing address is not available at the moment. Please try again later.`,
            });
            return Promise.reject(error);
        }
    };

    const openBillingAddressModal = async (
        props: Pick<EditBillingAdressModalInputs, 'subscription' | 'paymentsApi'> & {
            loadingKey: string;
        }
    ): Promise<FullBillingAddress> => {
        const { loadingKey, ...rest } = props;

        let fullBillingAddressBackend: FullBillingAddress;
        try {
            const promise = fetchBillingAddress(rest);
            void withLoadingByKey(loadingKey, promise);
            fullBillingAddressBackend = await promise;
        } catch (error) {
            return Promise.reject(error);
        }

        return showEditBillingAddressModal({
            ...rest,
            initialFullBillingAddress: fullBillingAddressBackend,
        });
    };

    return {
        editBillingAddressModal: editBillingAddressModal((props) => {
            return <EditBillingAddressModal {...props} />;
        }),
        openBillingAddressModal,
        loadingByKey,
    };
};

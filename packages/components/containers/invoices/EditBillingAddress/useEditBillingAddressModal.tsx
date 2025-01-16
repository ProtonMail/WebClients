import { useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import { type FullBillingAddress } from '@proton/payments';

import InvoiceTextNewModal from './EditBillingAddressModal';

export const useEditBillingAddressModal = () => {
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const [initialFullBillingAddress, setInitialFullBillingAddress] = useState<FullBillingAddress>();
    const { paymentsApi } = usePaymentsApi();
    const [loadingBillingAddressModal, withLoading] = useLoading();

    const openBillingAddressModal = (): Promise<unknown> => {
        return withLoading(async () => {
            const fullBillingAddress = await paymentsApi.getFullBillingAddress();
            setInitialFullBillingAddress(fullBillingAddress);
            // todo add error handling

            setModalOpen(true);
        });
    };

    const editBillingAddressModal =
        renderModal && !!initialFullBillingAddress ? (
            <InvoiceTextNewModal initialFullBillingAddress={initialFullBillingAddress} {...modalProps} />
        ) : null;

    return { editBillingAddressModal, openBillingAddressModal, loadingBillingAddressModal };
};

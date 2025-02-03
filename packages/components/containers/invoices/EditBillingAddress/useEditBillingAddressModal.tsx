import { useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { type FullBillingAddress } from '@proton/payments';

import InvoiceTextNewModal, { type EditInvoiceProps } from './EditBillingAddressModal';

export const useEditBillingAddressModal = () => {
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const [initialFullBillingAddress, setInitialFullBillingAddress] = useState<FullBillingAddress>();
    const [editExistingInvoiceProps, setEditExistingInvoiceProps] = useState<EditInvoiceProps>({
        editExistingInvoice: false,
    });
    const { paymentsApi } = usePaymentsApi();
    const { createNotification } = useNotifications();

    const openBillingAddressModal = async (props: EditInvoiceProps): Promise<void> => {
        try {
            let fullBillingAddress: FullBillingAddress;
            if (props.editExistingInvoice) {
                fullBillingAddress = await paymentsApi.getInvoiceBillingAddress(props.invoice.ID);
            } else {
                fullBillingAddress = await paymentsApi.getFullBillingAddress();
            }
            setInitialFullBillingAddress(fullBillingAddress);
            setEditExistingInvoiceProps(props);
            setModalOpen(true);
        } catch (error) {
            createNotification({
                type: 'error',
                text: c('Error').t`Editing billing address is not available at the moment. Please try again later.`,
            });
        }
    };

    const editBillingAddressModal =
        renderModal && !!initialFullBillingAddress ? (
            <InvoiceTextNewModal
                initialFullBillingAddress={initialFullBillingAddress}
                {...editExistingInvoiceProps}
                {...modalProps}
            />
        ) : null;

    return { editBillingAddressModal, openBillingAddressModal };
};

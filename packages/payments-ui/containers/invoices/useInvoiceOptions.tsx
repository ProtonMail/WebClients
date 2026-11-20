import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import noop from '@proton/utils/noop';

import { useEditBillingAddressModal } from '../../ui/billing-address/containers/useEditBillingAddressModal';
import InvoiceTextModal from './InvoiceTextModal';
import { useSetInvoiceEmailModal } from './SetInvoiceEmail/useSetInvoiceEmailModal';

export type InvoiceOptionKey = 'editBillingAddress' | 'editInvoiceNote' | 'setInvoiceEmail';

interface InvoiceOption {
    key: InvoiceOptionKey;
    text: string;
    onClick: () => void;
    loading: boolean;
    isSelected?: boolean;
}

const editBillingAddressLoadingKey = 'editBillingAddress';

/**
 * The billing address, invoice note and invoice email actions, shared by the "Invoice options" dropdown of
 * `InvoicesSection` and by `InvoiceOptionsSection`. Render `modals` next to whatever shows the options.
 */
export const useInvoiceOptions = ({ showInvoiceNote }: { showInvoiceNote: boolean }) => {
    const [subscription] = useSubscription();
    const [invoiceTextModalProps, setInvoiceTextModalOpen, renderInvoiceTextModal] = useModalState();
    const { openBillingAddressModal, editBillingAddressModal, loadingByKey } = useEditBillingAddressModal();
    const invoiceEmail = useSetInvoiceEmailModal();

    const options: InvoiceOption[] = [
        {
            key: 'editBillingAddress',
            text: c('Action').t`Edit billing address`,
            onClick: () =>
                openBillingAddressModal({
                    source: 'invoices',
                    loadingKey: editBillingAddressLoadingKey,
                    subscription,
                }).catch(noop),
            loading: !!loadingByKey[editBillingAddressLoadingKey],
        },
        ...(showInvoiceNote
            ? [
                  {
                      key: 'editInvoiceNote' as const,
                      text: c('Action').t`Edit invoice note`,
                      onClick: () => setInvoiceTextModalOpen(true),
                      loading: false,
                  },
              ]
            : []),
        ...(invoiceEmail.canSetInvoiceEmail
            ? [
                  {
                      key: 'setInvoiceEmail' as const,
                      text: c('Action').t`Set invoice email`,
                      onClick: () => invoiceEmail.openSetInvoiceEmailModal(),
                      loading: invoiceEmail.loading,
                      isSelected: invoiceEmail.sendEmailInvoice,
                  },
              ]
            : []),
    ];

    return {
        options,
        invoiceEmail,
        modals: (
            <>
                {renderInvoiceTextModal && <InvoiceTextModal {...invoiceTextModalProps} />}
                {editBillingAddressModal}
                {invoiceEmail.setInvoiceEmailModal}
            </>
        ),
    };
};

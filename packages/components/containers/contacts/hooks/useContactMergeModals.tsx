import { useModalTwo } from '../../../components/modalTwo/useModalTwo';
import ContactMergeDetailsModal, { ContactMergeDetailsModalProps } from '../merge/ContactMergeDetailsModal';
import ContactMergeModal, { ContactMergeModalProps, ContactMergeProps } from '../merge/ContactMergeModal';
import ContactMergePreviewModal, { ContactMergePreviewModalProps } from '../merge/ContactMergePreviewModal';

export const useContactMergeModals = () => {
    const [contactMergeModal, handleShowContactMergeModal] = useModalTwo<ContactMergeModalProps, void>(
        ContactMergeModal,
        false
    );

    const [contactMergePreviewModal, handleShowContactMergePreviewModal] = useModalTwo<
        ContactMergePreviewModalProps,
        void
    >(ContactMergePreviewModal, false);

    const [contactMergeDetailsModal, handleShowContactMergeDetailsModal] = useModalTwo<
        ContactMergeDetailsModalProps,
        void
    >(ContactMergeDetailsModal, false);

    const handleMergeDetails = (contactID: string) => {
        void handleShowContactMergeDetailsModal({ contactID });
    };

    const handleMergePreview = (props: ContactMergePreviewModalProps) => {
        void handleShowContactMergePreviewModal(props);
    };

    const handleMerge = (props: ContactMergeProps) => {
        void handleShowContactMergeModal({
            ...props,
            onMergeDetails: handleMergeDetails,
            onMergePreview: handleMergePreview,
        });
    };

    const modals = (
        <>
            {contactMergeModal}
            {contactMergePreviewModal}
            {contactMergeDetailsModal}
        </>
    );

    return {
        modals,
        onMerge: handleMerge,
    };
};

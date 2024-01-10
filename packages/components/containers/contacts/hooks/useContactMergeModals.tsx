import { useModalTwoStatic } from '../../../components/modalTwo/useModalTwo';
import ContactMergeDetailsModal from '../merge/ContactMergeDetailsModal';
import ContactMergeModal, { ContactMergeProps } from '../merge/ContactMergeModal';
import ContactMergePreviewModal, { ContactMergePreviewModalProps } from '../merge/ContactMergePreviewModal';

export const useContactMergeModals = () => {
    const [contactMergeModal, handleShowContactMergeModal] = useModalTwoStatic(ContactMergeModal);

    const [contactMergePreviewModal, handleShowContactMergePreviewModal] = useModalTwoStatic(ContactMergePreviewModal);

    const [contactMergeDetailsModal, handleShowContactMergeDetailsModal] = useModalTwoStatic(ContactMergeDetailsModal);

    const handleMergeDetails = (contactID: string) => {
        handleShowContactMergeDetailsModal({ contactID });
    };

    const handleMergePreview = (props: ContactMergePreviewModalProps) => {
        handleShowContactMergePreviewModal(props);
    };

    const handleMerge = (props: ContactMergeProps) => {
        handleShowContactMergeModal({
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

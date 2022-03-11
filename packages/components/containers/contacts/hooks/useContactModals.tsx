import { noop } from '@proton/shared/lib/helpers/function';
import { useModalTwo } from '../../../components/modalTwo/useModalTwo';
import ContactEditModal, { ContactEditProps } from '../edit/ContactEditModal';
import ContactDeleteModal, { ContactDeleteProps } from '../modals/ContactDeleteModal';
import ContactEmailSettingsModal, { ContactEmailSettingsProps } from '../modals/ContactEmailSettingsModal';
import ContactDetailsModal, { ContactDetailsProps } from '../view/ContactDetailsModal';

export const useContactModals = ({ onMailTo = noop }: { onMailTo: (email: string) => void }) => {
    const [contactDetailsModal, handleShowContactDetailsModal] = useModalTwo<ContactDetailsProps, void>(
        ContactDetailsModal,
        false
    );

    const [contactEditModal, handleShowContactEditModal] = useModalTwo<ContactEditProps, void>(ContactEditModal, false);

    const [contactDeleteModal, handleShowContactDeleteModal] = useModalTwo<ContactDeleteProps, void>(
        ContactDeleteModal,
        false
    );

    const [contactEmailSettingsModal, handleShowContactEmailSettingsModal] = useModalTwo<
        ContactEmailSettingsProps,
        void
    >(ContactEmailSettingsModal, false);

    const handleEdit = (props: ContactEditProps) => {
        void handleShowContactEditModal(props);
    };

    const handleDelete = (props: ContactDeleteProps) => {
        void handleShowContactDeleteModal(props);
    };

    const handleEmailSettings = (props: ContactEmailSettingsProps) => {
        void handleShowContactEmailSettingsModal(props);
    };

    const handleDetails = (contactID: string) => {
        void handleShowContactDetailsModal({
            contactID,
            onMailTo,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onEmailSettings: handleEmailSettings,
        });
    };

    const modals = (
        <>
            {contactDetailsModal}
            {contactEditModal}
            {contactDeleteModal}
            {contactEmailSettingsModal}
        </>
    );

    return {
        modals,
        onEdit: handleEdit,
        onDetails: handleDetails,
        onDelete: handleDelete,
        onEmailSettings: handleEmailSettings,
    };
};

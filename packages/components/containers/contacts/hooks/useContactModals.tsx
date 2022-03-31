import { noop } from '@proton/shared/lib/helpers/function';
import { useModalTwo } from '../../../components/modalTwo/useModalTwo';
import ContactEditModal, { ContactEditProps, ContactEditModalProps } from '../edit/ContactEditModal';
import ContactGroupDeleteModal, { ContactGroupDeleteProps } from '../group/ContactGroupDeleteModal';
import ContactGroupDetailsModal, { ContactGroupDetailsProps } from '../group/ContactGroupDetailsModal';
import ContactGroupEditModal, { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import ContactDeleteModal, { ContactDeleteProps } from '../modals/ContactDeleteModal';
import ContactEmailSettingsModal, { ContactEmailSettingsProps } from '../modals/ContactEmailSettingsModal';
import ContactDetailsModal, { ContactDetailsProps } from '../view/ContactDetailsModal';
import ContactExportingModal, { ContactExportingProps } from '../modals/ContactExportingModal';
import ContactUpgradeModal from '../modals/ContactUpgradeModal';

export const useContactModals = ({ onMailTo = noop }: { onMailTo: (email: string) => void }) => {
    const [contactDetailsModal, handleShowContactDetailsModal] = useModalTwo<ContactDetailsProps, void>(
        ContactDetailsModal,
        false
    );

    const [contactEditModal, handleShowContactEditModal] = useModalTwo<ContactEditProps & ContactEditModalProps, void>(
        ContactEditModal,
        false
    );

    const [contactDeleteModal, handleShowContactDeleteModal] = useModalTwo<ContactDeleteProps, void>(
        ContactDeleteModal,
        false
    );

    const [contactEmailSettingsModal, handleShowContactEmailSettingsModal] = useModalTwo<
        ContactEmailSettingsProps,
        void
    >(ContactEmailSettingsModal, false);

    const [contactExportModal, handleShowContactExportModal] = useModalTwo<ContactExportingProps, void>(
        ContactExportingModal,
        false
    );

    const [contactGroupDeleteModal, handleShowContactGroupDeleteModal] = useModalTwo<ContactGroupDeleteProps, void>(
        ContactGroupDeleteModal,
        false
    );

    const [contactGroupEditModal, handleShowContactGroupEditModal] = useModalTwo<ContactGroupEditProps, void>(
        ContactGroupEditModal,
        false
    );

    const [contactGroupDetailsModal, handleShowContactGroupDetailsModal] = useModalTwo<ContactGroupDetailsProps, void>(
        ContactGroupDetailsModal,
        false
    );

    const [contactUpgradeModal, handleShowContactUpgradeModal] = useModalTwo<void, void>(ContactUpgradeModal, false);

    const handleUpgrade = () => {
        void handleShowContactUpgradeModal();
    };

    const handleEdit = (props: ContactEditProps) => {
        void handleShowContactEditModal({
            ...props,
            onUpgrade: handleUpgrade,
        });
    };

    const handleDelete = (props: ContactDeleteProps) => {
        void handleShowContactDeleteModal(props);
    };

    const handleEmailSettings = (props: ContactEmailSettingsProps) => {
        void handleShowContactEmailSettingsModal(props);
    };

    const handleExport = (props: ContactExportingProps = {}) => {
        void handleShowContactExportModal(props);
    };

    const handleGroupEdit = (props: ContactGroupEditProps) => {
        void handleShowContactGroupEditModal(props);
    };

    const handleGroupDelete = (props: ContactGroupDeleteProps) => {
        void handleShowContactGroupDeleteModal(props);
    };

    const handleGroupDetails = (contactGroupID: string) => {
        void handleShowContactGroupDetailsModal({
            contactGroupID,
            onEdit: handleGroupEdit,
            onDelete: handleGroupDelete,
            onExport: handleExport,
            onUpgrade: handleUpgrade,
        });
    };

    const handleDetails = (contactID: string) => {
        void handleShowContactDetailsModal({
            contactID,
            onMailTo,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onEmailSettings: handleEmailSettings,
            onGroupDetails: handleGroupDetails,
            onUpgrade: handleUpgrade,
        });
    };

    const modals = (
        <>
            {contactDetailsModal}
            {contactEditModal}
            {contactDeleteModal}
            {contactEmailSettingsModal}
            {contactExportModal}
            {contactGroupDetailsModal}
            {contactGroupEditModal}
            {contactGroupDeleteModal}
            {contactUpgradeModal}
        </>
    );

    return {
        modals,
        onEdit: handleEdit,
        onDetails: handleDetails,
        onDelete: handleDelete,
        onEmailSettings: handleEmailSettings,
        onExport: handleExport,
        onGroupDetails: handleGroupDetails,
        onGroupEdit: handleGroupEdit,
        onGroupDelete: handleGroupDelete,
        onUpgrade: handleUpgrade,
    };
};

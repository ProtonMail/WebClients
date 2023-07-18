import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import noop from '@proton/utils/noop';

import { useModalTwo } from '../../../components/modalTwo/useModalTwo';
import ContactEditModal, { ContactEditModalProps, ContactEditProps } from '../edit/ContactEditModal';
import ContactEmailSettingsModal, { ContactEmailSettingsProps } from '../email/ContactEmailSettingsModal';
import ContactGroupDeleteModal, { ContactGroupDeleteProps } from '../group/ContactGroupDeleteModal';
import ContactGroupDetailsModal, { ContactGroupDetailsProps } from '../group/ContactGroupDetailsModal';
import ContactGroupEditModal, { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import ContactClearDataConfirmModal, {
    ContactClearDataConfirmModalProps,
    ContactClearDataConfirmProps,
} from '../modals/ContactClearDataConfirmModal';
import ContactClearDataExecutionModal, {
    ContactClearDataExecutionProps,
} from '../modals/ContactClearDataExecutionModal';
import ContactDecryptionErrorModal, {
    ContactDecryptionErrorModalProps,
    ContactDecryptionErrorProps,
} from '../modals/ContactDecryptionErrorModal';
import ContactDeleteModal, { ContactDeleteProps } from '../modals/ContactDeleteModal';
import ContactExportingModal, { ContactExportingProps } from '../modals/ContactExportingModal';
import ContactGroupLimitReachedModal, { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import ContactImageModal, { ContactImageProps } from '../modals/ContactImageModal';
import ContactResignExecutionModal from '../modals/ContactResignExecutionModal';
import ContactSignatureErrorModal, {
    ContactSignatureErrorModalProps,
    ContactSignatureErrorProps,
} from '../modals/ContactSignatureErrorModal';
import ContactUpgradeModal from '../modals/ContactUpgradeModal';
import SelectEmailsModal, { SelectEmailsProps } from '../modals/SelectEmailsModal';
import ContactDetailsModal, { ContactDetailsProps } from '../view/ContactDetailsModal';

interface Props {
    onMailTo?: (email: string) => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onChange?: () => void;
}
export const useContactModals = ({ onMailTo = noop, onCompose, onChange }: Props = {}) => {
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

    const [contactExportingModal, handleShowContactExportingModal] = useModalTwo<ContactExportingProps, void>(
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

    const [contactImageModal, handleShowContactImageModal] = useModalTwo<ContactImageProps, void>(
        ContactImageModal,
        false
    );

    const [contactSignatureErrorModal, handleShowContactSignatureErrorModal] = useModalTwo<
        ContactSignatureErrorProps & ContactSignatureErrorModalProps,
        void
    >(ContactSignatureErrorModal, false);

    const [contactResignExecutionModal, handleShowContactResignExecutionModal] = useModalTwo<void, void>(
        ContactResignExecutionModal,
        false
    );

    const [contactDecryptionErrorModal, handleShowContactDecryptionErrorModal] = useModalTwo<
        ContactDecryptionErrorProps & ContactDecryptionErrorModalProps,
        void
    >(ContactDecryptionErrorModal, false);

    const [contactClearDataConfirmModal, handleShowContactClearDataConfirmModal] = useModalTwo<
        ContactClearDataConfirmProps & ContactClearDataConfirmModalProps,
        void
    >(ContactClearDataConfirmModal, false);

    const [contactClearDataExecutionModal, handleShowContactClearDataExecutionModal] = useModalTwo<
        ContactClearDataExecutionProps,
        void
    >(ContactClearDataExecutionModal, false);

    const [contactSelectEmailsModal, handleShowContactSelectEmailsModal] = useModalTwo<
        SelectEmailsProps,
        ContactEmail[]
    >(SelectEmailsModal);

    const [contactGroupLimitReachedModal, handleShowContactGroupLimitReachedModal] = useModalTwo<
        ContactGroupLimitReachedProps,
        void
    >(ContactGroupLimitReachedModal, false);

    const handleUpgrade = () => {
        void handleShowContactUpgradeModal();
    };

    const handleSelectImage = (props: ContactImageProps) => {
        void handleShowContactImageModal(props);
    };

    const handleResign = () => {
        void handleShowContactResignExecutionModal();
    };

    const handleSignatureError = (contactID: string) => {
        void handleShowContactSignatureErrorModal({ contactID, onResign: handleResign });
    };

    const handleClearData = (props: ContactClearDataExecutionProps) => {
        void handleShowContactClearDataExecutionModal(props);
    };

    const handleClearDataConfirm = (props: ContactClearDataConfirmProps) => {
        void handleShowContactClearDataConfirmModal({ ...props, onClearData: handleClearData });
    };

    const handleDecryptionError = (contactID: string) => {
        void handleShowContactDecryptionErrorModal({ contactID, onClearDataConfirm: handleClearDataConfirm });
    };

    const handleGroupEdit = (props: ContactGroupEditProps) => {
        void handleShowContactGroupEditModal(props);
    };

    const handleContactLimitReached = (props: ContactGroupLimitReachedProps) => {
        return handleShowContactGroupLimitReachedModal(props);
    };

    const handleEdit = (props: ContactEditProps) => {
        void handleShowContactEditModal({
            ...props,
            onChange,
            onUpgrade: handleUpgrade,
            onSelectImage: handleSelectImage,
            onGroupEdit: handleGroupEdit,
            onLimitReached: handleContactLimitReached,
        });
    };

    const handleDelete = (props: ContactDeleteProps) => {
        void handleShowContactDeleteModal({
            ...props,
            onDelete: (...args) => {
                onChange?.();
                props.onDelete?.(...args);
            },
        });
    };

    const handleEmailSettings = (props: ContactEmailSettingsProps) => {
        void handleShowContactEmailSettingsModal(props);
    };

    const handleExport = (props: ContactExportingProps = {}) => {
        void handleShowContactExportingModal(props);
    };

    const handleGroupDelete = (props: ContactGroupDeleteProps) => {
        void handleShowContactGroupDeleteModal(props);
    };

    const handleGroupDetails = (contactGroupID: string, onCloseContactDetailsModal?: () => void) => {
        void handleShowContactGroupDetailsModal({
            contactGroupID,
            onEdit: handleGroupEdit,
            onDelete: handleGroupDelete,
            onExport: handleExport,
            onUpgrade: handleUpgrade,
            onCompose: onCompose,
            onCloseContactDetailsModal, // We want to close the contact details modal onCompose if we opened group details modal from contact details modal
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
            onGroupEdit: handleGroupEdit,
            onUpgrade: handleUpgrade,
            onSignatureError: handleSignatureError,
            onDecryptionError: handleDecryptionError,
        });
    };

    const handleSelectEmails = (props: SelectEmailsProps) => {
        return handleShowContactSelectEmailsModal(props);
    };

    const modals = (
        <>
            {contactDetailsModal}
            {contactEditModal}
            {contactDeleteModal}
            {contactEmailSettingsModal}
            {contactExportingModal}
            {contactGroupDetailsModal}
            {contactGroupEditModal}
            {contactGroupDeleteModal}
            {contactUpgradeModal}
            {contactImageModal}
            {contactSignatureErrorModal}
            {contactResignExecutionModal}
            {contactDecryptionErrorModal}
            {contactClearDataConfirmModal}
            {contactClearDataExecutionModal}
            {contactSelectEmailsModal}
            {contactGroupLimitReachedModal}
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
        onSignatureError: handleSignatureError,
        onDecryptionError: handleDecryptionError,
        onSelectEmails: handleSelectEmails,
        onLimitReached: handleContactLimitReached,
    };
};

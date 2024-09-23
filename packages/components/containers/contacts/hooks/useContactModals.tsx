import { useModalTwo, useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import type { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { ContactEditProps } from '../edit/ContactEditModal';
import ContactEditModal from '../edit/ContactEditModal';
import type { ContactEmailSettingsProps } from '../email/ContactEmailSettingsModal';
import ContactEmailSettingsModal from '../email/ContactEmailSettingsModal';
import type { ContactGroupDeleteProps } from '../group/ContactGroupDeleteModal';
import ContactGroupDeleteModal from '../group/ContactGroupDeleteModal';
import ContactGroupDetailsModal from '../group/ContactGroupDetailsModal';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import ContactGroupEditModal from '../group/ContactGroupEditModal';
import type { ContactClearDataConfirmProps } from '../modals/ContactClearDataConfirmModal';
import ContactClearDataConfirmModal from '../modals/ContactClearDataConfirmModal';
import type { ContactClearDataExecutionProps } from '../modals/ContactClearDataExecutionModal';
import ContactClearDataExecutionModal from '../modals/ContactClearDataExecutionModal';
import ContactDecryptionErrorModal from '../modals/ContactDecryptionErrorModal';
import type { ContactDeleteProps } from '../modals/ContactDeleteModal';
import ContactDeleteModal from '../modals/ContactDeleteModal';
import type { ContactExportingProps } from '../modals/ContactExportingModal';
import ContactExportingModal from '../modals/ContactExportingModal';
import type { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import ContactGroupLimitReachedModal from '../modals/ContactGroupLimitReachedModal';
import type { ContactImageProps } from '../modals/ContactImageModal';
import ContactImageModal from '../modals/ContactImageModal';
import ContactResignExecutionModal from '../modals/ContactResignExecutionModal';
import ContactSignatureErrorModal from '../modals/ContactSignatureErrorModal';
import ContactUpgradeModal from '../modals/ContactUpgradeModal';
import type { SelectEmailsProps } from '../modals/SelectEmailsModal';
import SelectEmailsModal from '../modals/SelectEmailsModal';
import ContactDetailsModal from '../view/ContactDetailsModal';

interface Props {
    onMailTo?: (email: string) => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onChange?: () => void;
}

export const useContactModals = ({ onMailTo = noop, onCompose, onChange }: Props = {}) => {
    const [contactDetailsModal, handleShowContactDetailsModal] = useModalTwoStatic(ContactDetailsModal);

    const [contactEditModal, handleShowContactEditModal] = useModalTwoStatic(ContactEditModal);

    const [contactDeleteModal, handleShowContactDeleteModal] = useModalTwoStatic(ContactDeleteModal);

    const [contactEmailSettingsModal, handleShowContactEmailSettingsModal] =
        useModalTwoStatic(ContactEmailSettingsModal);

    const [contactExportingModal, handleShowContactExportingModal] = useModalTwoStatic(ContactExportingModal);

    const [contactGroupDeleteModal, handleShowContactGroupDeleteModal] = useModalTwoStatic(ContactGroupDeleteModal);

    const [contactGroupEditModal, handleShowContactGroupEditModal] = useModalTwoStatic(ContactGroupEditModal);

    const [contactGroupDetailsModal, handleShowContactGroupDetailsModal] = useModalTwoStatic(ContactGroupDetailsModal);

    const [contactUpgradeModal, handleShowContactUpgradeModal] = useModalTwoStatic(ContactUpgradeModal);

    const [contactImageModal, handleShowContactImageModal] = useModalTwoStatic(ContactImageModal);

    const [contactSignatureErrorModal, handleShowContactSignatureErrorModal] =
        useModalTwoStatic(ContactSignatureErrorModal);

    const [contactResignExecutionModal, handleShowContactResignExecutionModal] =
        useModalTwoStatic(ContactResignExecutionModal);

    const [contactDecryptionErrorModal, handleShowContactDecryptionErrorModal] =
        useModalTwoStatic(ContactDecryptionErrorModal);

    const [contactClearDataConfirmModal, handleShowContactClearDataConfirmModal] =
        useModalTwoStatic(ContactClearDataConfirmModal);

    const [contactClearDataExecutionModal, handleShowContactClearDataExecutionModal] =
        useModalTwoStatic(ContactClearDataExecutionModal);

    const [contactSelectEmailsModal, handleShowContactSelectEmailsModal] = useModalTwo(SelectEmailsModal);

    const [contactGroupLimitReachedModal, handleShowContactGroupLimitReachedModal] =
        useModalTwoStatic(ContactGroupLimitReachedModal);

    const handleUpgrade = () => {
        handleShowContactUpgradeModal({});
    };

    const handleSelectImage = (props: ContactImageProps) => {
        handleShowContactImageModal(props);
    };

    const handleResign = () => {
        handleShowContactResignExecutionModal({});
    };

    const handleSignatureError = (contactID: string) => {
        handleShowContactSignatureErrorModal({ contactID, onResign: handleResign });
    };

    const handleClearData = (props: ContactClearDataExecutionProps) => {
        handleShowContactClearDataExecutionModal(props);
    };

    const handleClearDataConfirm = (props: ContactClearDataConfirmProps) => {
        handleShowContactClearDataConfirmModal({ ...props, onClearData: handleClearData });
    };

    const handleDecryptionError = (contactID: string) => {
        handleShowContactDecryptionErrorModal({ contactID, onClearDataConfirm: handleClearDataConfirm });
    };

    const handleGroupEdit = (props: ContactGroupEditProps) => {
        handleShowContactGroupEditModal(props);
    };

    const handleContactLimitReached = (props: ContactGroupLimitReachedProps) => {
        return handleShowContactGroupLimitReachedModal(props);
    };

    const handleEdit = (props: ContactEditProps) => {
        handleShowContactEditModal({
            ...props,
            onChange,
            onUpgrade: handleUpgrade,
            onSelectImage: handleSelectImage,
            onGroupEdit: handleGroupEdit,
            onLimitReached: handleContactLimitReached,
        });
    };

    const handleDelete = (props: ContactDeleteProps) => {
        handleShowContactDeleteModal({
            ...props,
            onDelete: (...args) => {
                onChange?.();
                props.onDelete?.(...args);
            },
        });
    };

    const handleEmailSettings = (props: ContactEmailSettingsProps) => {
        handleShowContactEmailSettingsModal(props);
    };

    const handleExport = (props: ContactExportingProps = {}) => {
        handleShowContactExportingModal(props);
    };

    const handleGroupDelete = (props: ContactGroupDeleteProps) => {
        handleShowContactGroupDeleteModal(props);
    };

    const handleGroupDetails = (contactGroupID: string, onCloseContactDetailsModal?: () => void) => {
        handleShowContactGroupDetailsModal({
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
        handleShowContactDetailsModal({
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

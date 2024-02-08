import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ModalStateProps, ModalTwo, useConfirmActionModal, useModalTwoStatic } from '@proton/components';

import { useShareURLView } from '../../../store';
import ModalContentLoader from '../ModalContentLoader';
import ErrorState from './ErrorState';
import GeneratedLinkState from './GeneratedLinkState';

interface Props {
    modalTitleID?: string;
    shareId: string;
    linkId: string;
}

export function ShareLinkModal({
    modalTitleID = 'share-link-modal',
    shareId,
    linkId,
    onClose,
    ...modalProps
}: Props & ModalStateProps) {
    const [confirmActionModal, showConfirmActionModal] = useConfirmActionModal();
    const {
        isDeleting,
        isSaving,
        name,
        initialExpiration,
        customPassword,
        sharedLink,
        confirmationMessage,
        loadingMessage,
        errorMessage,
        sharedInfoMessage,
        hasCustomPassword,
        hasGeneratedPasswordIncluded,
        hasExpirationTime,
        saveSharedLink,
        deleteLink,
    } = useShareURLView(shareId, linkId);

    const [passwordToggledOn, setPasswordToggledOn] = useState(false);
    const [expirationToggledOn, setExpirationToggledOn] = useState(false);

    const [isSharingFormDirty, setIsSharingFormDirty] = useState(false);

    const handleFormStateChange = ({ isFormDirty }: { isFormDirty: boolean }) => {
        setIsSharingFormDirty(isFormDirty);
    };

    useEffect(() => {
        if (!loadingMessage) {
            setPasswordToggledOn(hasCustomPassword);
            setExpirationToggledOn(hasExpirationTime);
        }
    }, [loadingMessage]);

    const handleDeleteLink = async () => {
        void showConfirmActionModal({
            title: c('Title').t`Stop sharing with everyone?`,
            submitText: c('Action').t`Stop sharing`,
            message: confirmationMessage,
            canUndo: true,
            onSubmit: () => deleteLink().finally(() => onClose()),
        });
    };

    const handleClose = () => {
        if (!isSharingFormDirty) {
            onClose?.();
            return;
        }

        void showConfirmActionModal({
            title: c('Title').t`Discard changes?`,
            submitText: c('Title').t`Discard`,
            message: c('Info').t`You will lose all unsaved changes.`,
            onSubmit: async () => onClose?.(),
            canUndo: true,
        });
    };

    const toggleIncludePassword = () => {
        setPasswordToggledOn((passwordToggledOn) => !passwordToggledOn);
    };

    const toggleIncludeExpirationTime = () => {
        setExpirationToggledOn((expirationToggledOn) => !expirationToggledOn);
    };

    const renderModalState = () => {
        if (errorMessage) {
            return <ErrorState onClose={onClose}>{errorMessage}</ErrorState>;
        }

        if (loadingMessage) {
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        return (
            <GeneratedLinkState
                modalTitleID={modalTitleID}
                passwordToggledOn={passwordToggledOn}
                expirationToggledOn={expirationToggledOn}
                itemName={name}
                sharedInfoMessage={sharedInfoMessage}
                onClose={handleClose}
                onIncludePasswordToggle={toggleIncludePassword}
                onIncludeExpirationTimeToogle={toggleIncludeExpirationTime}
                onSaveLinkClick={saveSharedLink}
                onDeleteLinkClick={handleDeleteLink}
                onFormStateChange={handleFormStateChange}
                customPassword={customPassword}
                initialExpiration={initialExpiration}
                url={sharedLink}
                modificationDisabled={!hasGeneratedPasswordIncluded}
                deleting={isDeleting}
                saving={isSaving}
            />
        );
    };

    return (
        <>
            <ModalTwo
                as="form"
                onClose={handleClose}
                onReset={(e: any) => {
                    e.preventDefault();
                    handleClose();
                }}
                disableCloseOnEscape={isSaving || isDeleting}
                size="large"
                {...modalProps}
            >
                {renderModalState()}
            </ModalTwo>
            {confirmActionModal}
        </>
    );
}

export default ShareLinkModal;
export const useLinkSharingModal = () => {
    return useModalTwoStatic(ShareLinkModal);
};

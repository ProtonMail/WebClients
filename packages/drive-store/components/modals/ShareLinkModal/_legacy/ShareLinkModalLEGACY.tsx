import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { ModalTwo, useConfirmActionModal } from '@proton/components';

import { useLegacyShareURLView } from '../../../../store';
import ModalContentLoader from '../../ModalContentLoader';
import ErrorStateLEGACY from './ErrorStateLEGACY';
import GeneratedLinkStateLEGACY from './GeneratedLinkStateLEGACY';

interface Props {
    modalTitleID?: string;
    shareId: string;
    linkId: string;
}

export function ShareLinkModalLEGACY({
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
    } = useLegacyShareURLView(shareId, linkId);

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
            return <ErrorStateLEGACY onClose={onClose}>{errorMessage}</ErrorStateLEGACY>;
        }

        if (loadingMessage) {
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        return (
            <GeneratedLinkStateLEGACY
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

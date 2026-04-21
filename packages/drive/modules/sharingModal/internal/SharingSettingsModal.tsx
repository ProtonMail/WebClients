import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, Toggle, useConfirmActionModal, useModalTwoStatic } from '@proton/components';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

import { useEditorsManageAccessContext } from './useEditorsManageAccess';

export interface SharingSettingsModalProps {
    sharedFileName: string;
    stopSharing: () => Promise<void>;
}

const SharingSettingsModal = ({
    sharedFileName,
    stopSharing,
    onClose,
    onExit,
    open,
}: SharingSettingsModalProps & ModalProps) => {
    const [confirmActionModal, showConfirmActionModal] = useConfirmActionModal();

    const [isLoading, setIsLoading] = useState(false);
    const { editorsManageAccess, changeManageAccess } = useEditorsManageAccessContext();
    const toggleManageAccess = async () => {
        setIsLoading(true);
        try {
            await changeManageAccess(!editorsManageAccess);
        } finally {
            // Error already caught in changeManageAccess
            setIsLoading(false);
        }
    };

    const handleStopSharing = async () => {
        void showConfirmActionModal({
            title: c('Title').t`Stop sharing?`,
            submitText: c('Action').t`Stop sharing`,
            message: c('Info').t`This action will delete the link and revoke access for all users.`,
            canUndo: true, // Just to hide the message
            onSubmit: stopSharing,
        });
    };

    return (
        <>
            <ModalTwo as="form" size="large" onClose={onClose} onExit={onExit} open={open} fullscreenOnMobile>
                <div
                    className="flex items-center justify-space-between flex-nowrap border-bottom border-weak px-8 py-3 mb-5"
                    data-testid="modal-two-header"
                >
                    <div className="flex items-center flex-nowrap gap-2">
                        <Button color="weak" shape="ghost" icon onClick={onClose}>
                            <IcArrowLeft />
                        </Button>
                        <span className="modal-two-header-title h4 text-bold text-ellipsis">
                            {c('Title').t`Settings for ${sharedFileName}`}
                        </span>
                    </div>
                    <ModalHeaderCloseButton />
                </div>

                <ModalTwoContent className="mb-7">
                    <div
                        className="flex flex-nowrap justify-space-between items-center"
                        data-testid="share-modal-settings-editorsAccessSection"
                    >
                        <div className="flex flex-column flex-1 p-0 gap-2" data-testid="delete-share-text">
                            <span className="text-semibold">{c('Label').t`Access`}</span>
                            <span className="color-weak">{c('Label')
                                .t`Allow editors to change permissions and share`}</span>
                        </div>
                        <Toggle
                            id="SharingSettingsModal"
                            checked={editorsManageAccess}
                            onChange={toggleManageAccess}
                            loading={isLoading}
                        />
                    </div>
                    <hr className="my-5 bg-weak" />

                    <div
                        className="flex flex-nowrap justify-space-between items-center"
                        data-testid="share-modal-settings-deleteShareSection"
                    >
                        <div className="flex flex-column flex-1 p-0 gap-2" data-testid="delete-share-text">
                            <span className="text-semibold">{c('Label').t`Stop sharing`}</span>
                            <span className="color-weak">{c('Label')
                                .t`Delete link and remove access for everyone`}</span>
                        </div>
                        <Button
                            className="flex items-center"
                            shape="ghost"
                            color="danger"
                            onClick={handleStopSharing}
                            data-testid="delete-share-button"
                        >{c('Action').t`Stop sharing`}</Button>
                    </div>
                </ModalTwoContent>
            </ModalTwo>

            {confirmActionModal}
        </>
    );
};

export const useSharingSettingsModal = () => {
    return useModalTwoStatic(SharingSettingsModal);
};

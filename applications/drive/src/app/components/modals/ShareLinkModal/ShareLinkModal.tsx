import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Icon,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    Tooltip,
    useModalTwoStatic,
} from '@proton/components';

import { useDriveSharingFeatureFlag, useShareURLView } from '../../../store';
import ModalContentLoader from '../ModalContentLoader';
import DirectSharing from './DirectSharing';
import ErrorState from './ErrorState';
import { useLinkSharingSettingsModal } from './ShareLinkSettingsModal';
import ShareWithAnyone from './ShareWithAnyone';
import { ShareLinkModalLEGACY } from './_legacy/ShareLinkModalLEGACY';

interface Props {
    modalTitleID?: string;
    shareId: string;
    linkId: string;
}

export function ShareLinkModal({ shareId: rootShareId, linkId, onClose, ...modalProps }: Props & ModalStateProps) {
    const {
        customPassword,
        initialExpiration,
        name,
        deleteLink,
        sharedLink,
        errorMessage,
        loadingMessage,
        confirmationMessage,
        hasGeneratedPasswordIncluded,
        createSharedLink,
        saveSharedLink,
        isSaving,
        isDeleting,
        isCreating,
        isShareUrlLoading,
    } = useShareURLView(rootShareId, linkId);

    const [settingsModal, showSettingsModal] = useLinkSharingSettingsModal();
    const [isDirectSharingWorkflow, setIsDirectSharingWorkflow] = useState(false);

    const handleDeleteSharedLink = () => deleteLink().then(() => onClose());
    // TODO: Add Share deletion
    const handleDeleteShare = handleDeleteSharedLink;

    const renderModalState = () => {
        if (errorMessage) {
            return <ErrorState onClose={onClose}>{errorMessage}</ErrorState>;
        }

        if (loadingMessage && !isShareUrlLoading) {
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        return (
            <div className="mb-4">
                <ModalTwoHeader
                    title={c('Title').t`Share ${name}`}
                    closeButtonProps={{ disabled: isSaving || isDeleting || isCreating }}
                    actions={[
                        <Tooltip
                            disabled={isShareUrlLoading || isSaving || isDeleting || isCreating}
                            title={c('Info').t`Share via link settings`}
                        >
                            <Button
                                icon
                                shape="ghost"
                                onClick={() =>
                                    showSettingsModal({
                                        customPassword,
                                        initialExpiration,
                                        onSaveLinkClick: saveSharedLink,
                                        isDeleting,
                                        deleteLink: handleDeleteShare,
                                        deleteShareEnabled: !!sharedLink, //For now it's only based on sharedLink existance
                                        havePublicSharedLink: !!sharedLink,
                                        confirmationMessage,
                                        modificationDisabled: !hasGeneratedPasswordIncluded,
                                    })
                                }
                            >
                                <Icon name="cog-wheel" />
                            </Button>
                        </Tooltip>,
                    ]}
                />
                <ModalTwoContent>
                    <DirectSharing
                        rootShareId={rootShareId}
                        linkId={linkId}
                        isDirectSharingWorkflow={isDirectSharingWorkflow}
                        onClose={() => setIsDirectSharingWorkflow(false)}
                        onSubmit={() => setIsDirectSharingWorkflow(false)}
                        onFocus={() => setIsDirectSharingWorkflow(true)}
                    />
                    {!isDirectSharingWorkflow ? (
                        <ShareWithAnyone
                            createSharedLink={createSharedLink}
                            isShareUrlLoading={isShareUrlLoading}
                            publicSharedLink={sharedLink}
                            deleteSharedLink={handleDeleteSharedLink}
                            isDeleting={isDeleting}
                            isCreating={isCreating}
                        />
                    ) : null}
                </ModalTwoContent>
            </div>
        );
    };

    return (
        <>
            <ModalTwo
                as="form"
                onClose={onClose}
                onReset={(e: any) => {
                    e.preventDefault();
                    onClose();
                }}
                disableCloseOnEscape={isSaving || isDeleting}
                size="large"
                fullscreenOnMobile
                {...modalProps}
            >
                {renderModalState()}
            </ModalTwo>
            {settingsModal}
        </>
    );
}

export const useLinkSharingModal = () => {
    const driveSharing = useDriveSharingFeatureFlag();
    return useModalTwoStatic(driveSharing ? ShareLinkModal : ShareLinkModalLEGACY);
};

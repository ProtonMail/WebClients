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
        stopSharing,
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
        isShared,
        isShareUrlLoading,
    } = useShareURLView(rootShareId, linkId);

    const [settingsModal, showSettingsModal] = useLinkSharingSettingsModal();
    const [isDirectSharingWorkflow, setIsDirectSharingWorkflow] = useState(false);

    const isClosedButtonDisabled = isSaving || isDeleting || isCreating;
    const isTooltipDisabled = isShareUrlLoading || isSaving || isDeleting || isCreating || !isShared;
    const isShareWithAnyoneLoading = isShareUrlLoading || isDeleting || isCreating;

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
                    closeButtonProps={{ disabled: isClosedButtonDisabled }}
                    actions={[
                        <Tooltip disabled={isTooltipDisabled} title={c('Info').t`Share via link settings`}>
                            <Button
                                icon
                                shape="ghost"
                                onClick={() =>
                                    showSettingsModal({
                                        customPassword,
                                        initialExpiration,
                                        onSaveLinkClick: saveSharedLink,
                                        isDeleting,
                                        stopSharing: async () => {
                                            await stopSharing();
                                            onClose();
                                        },
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
                            isLoading={isShareWithAnyoneLoading}
                            publicSharedLink={sharedLink}
                            deleteSharedLink={deleteLink}
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

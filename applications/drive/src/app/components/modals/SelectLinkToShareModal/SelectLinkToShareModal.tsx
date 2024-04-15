import { useState } from 'react';

import { c } from 'ttag';

import { ModalStateProps, ModalTwo, useModalTwoStatic } from '@proton/components';
import { useLoading } from '@proton/hooks';

import { DecryptedLink, useDriveSharingFeatureFlag, useTreeForModals } from '../../../store';
import ModalContentLoader from '../ModalContentLoader';
import { useLinkSharingModal } from '../ShareLinkModal/ShareLinkModal';
import { ModalContent } from './ModalContent';

interface Props {
    shareId: string;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    onClose?: () => void;
}

const SelectedFileToShareModal = ({
    shareId,
    onClose,
    showLinkSharingModal,
    ...modalProps
}: Props & ModalStateProps) => {
    const { rootItems, toggleExpand, isLoaded: isTreeLoaded } = useTreeForModals(shareId, { rootExpanded: true });
    const driveSharing = useDriveSharingFeatureFlag();

    const [loading, withLoading] = useLoading();
    const [selectedFile, setSelectedFile] = useState<DecryptedLink>();

    const onSelect = async (link: DecryptedLink) => {
        if (!loading) {
            setSelectedFile(link);
        }
    };

    const handleSubmit = async () => {
        if (selectedFile) {
            void showLinkSharingModal({ shareId, linkId: selectedFile.linkId });
            onClose?.();
        }
    };

    const isSharingDisabled = !selectedFile || !selectedFile.parentLinkId;

    const actionTextLEGACY = selectedFile?.shareUrl ? c('Action').t`Manage link` : c('Action').t`Create link`;
    const actionText = c('Action').t`Share`;
    return (
        <ModalTwo
            onReset={onClose}
            onClose={onClose}
            onSubmit={(e: any) => {
                e.preventDefault();
                withLoading(handleSubmit()).catch(console.error);
            }}
            size="large"
            as="form"
            {...modalProps}
        >
            {isTreeLoaded ? (
                <ModalContent
                    isLoading={loading}
                    isTreeLoaded={isTreeLoaded}
                    rootItems={rootItems}
                    selectedLinkId={selectedFile?.linkId}
                    isSharingDisabled={isSharingDisabled}
                    actionText={driveSharing ? actionText : actionTextLEGACY}
                    toggleExpand={toggleExpand}
                    onSelect={onSelect}
                />
            ) : (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            )}
        </ModalTwo>
    );
};

export default SelectedFileToShareModal;
export const useFileSharingModal = () => {
    return useModalTwoStatic(SelectedFileToShareModal);
};

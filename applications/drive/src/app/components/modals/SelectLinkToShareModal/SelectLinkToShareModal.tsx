import { useState } from 'react';

import { c } from 'ttag';

import { ModalStateProps, ModalTwo, useModalTwo } from '@proton/components';
import { useLoading } from '@proton/hooks';

import { DecryptedLink, useTreeForModals } from '../../../store';
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
                    actionText={selectedFile?.shareUrl ? c('Action').t`Manage link` : c('Action').t`Create link`}
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
    return useModalTwo<Props, void>(SelectedFileToShareModal, false);
};

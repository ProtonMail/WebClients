import { useState } from 'react';

import { c } from 'ttag';

import { ModalTwo, useLoading } from '@proton/components';

import { DecryptedLink, useTreeForModals } from '../../store';
import ModalContentLoader from '../ModalContentLoader';
import useOpenModal from '../useOpenModal';
import { ModalContent } from './ModalContent';

interface Props {
    shareId: string;
    onClose?: () => void;
    open?: boolean;
}

const SelectedFileToShareModal = ({ shareId, onClose, open }: Props) => {
    const { rootItems, toggleExpand, isLoaded: isTreeLoaded } = useTreeForModals(shareId, { rootExpanded: true });

    const [loading, withLoading] = useLoading();
    const [selectedFile, setSelectedFile] = useState<DecryptedLink>();
    const { openLinkSharing } = useOpenModal();

    const onSelect = async (link: DecryptedLink) => {
        if (!loading) {
            setSelectedFile(link);
        }
    };

    const handleSubmit = async () => {
        if (selectedFile) {
            openLinkSharing(shareId, selectedFile.linkId);
            onClose?.();
        }
    };

    const isSharingDisabled = !selectedFile || !selectedFile.parentLinkId;

    return (
        <ModalTwo
            open={open}
            onReset={onClose}
            onClose={onClose}
            onSubmit={(e: any) => {
                e.preventDefault();
                withLoading(handleSubmit()).catch(console.error);
            }}
            size="large"
            as="form"
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

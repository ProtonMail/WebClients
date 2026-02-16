import { useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { ModalTwo, useModalTwoStatic } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';

import type { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import type { DecryptedLink } from '../../../store';
import { useTreeForModals } from '../../../store';
import ModalContentLoader from '../ModalContentLoader';
import { ModalContent } from './ModalContent';

interface Props {
    shareId: string;
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
    onClose?: () => void;
}

const SelectedFileToShareModal = ({ shareId, onClose, showSharingModal, ...modalProps }: Props & ModalStateProps) => {
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
            void showSharingModal({ nodeUid: generateNodeUid(selectedFile.volumeId, selectedFile.linkId) });
            onClose?.();
        }
    };

    const isSharingDisabled = !selectedFile || !selectedFile.parentLinkId;
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
                    actionText={actionText}
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

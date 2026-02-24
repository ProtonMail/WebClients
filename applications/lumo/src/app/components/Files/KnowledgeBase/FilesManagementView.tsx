import React, { useEffect, useState } from 'react';

import { ModalTwo, ModalTwoContent, useActiveBreakpoint, useModalState } from '@proton/components';

import { useLumoSelector } from '../../../redux/hooks';
import { selectProvisionalAttachments } from '../../../redux/selectors';
import type { Attachment, Message } from '../../../types';
import { FileContentModal } from '../Common/FileContentModal';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';

import './KnowledgeBasePanel.scss';

interface FilesManagementViewProps {
    messageChain: Message[];
    filesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    filterMessage?: Message; // Optional message to filter by
    onClearFilter?: () => void; // Optional callback to clear the filter
    initialShowDriveBrowser?: boolean; // Whether to show Drive browser initially
    forceModal?: boolean; // Force modal mode regardless of screen size
    spaceId?: string; // Optional space ID to include space-level attachments
}

export const FilesManagementView = ({
    messageChain,
    filesContainerRef,
    onClose,
    filterMessage,
    onClearFilter,
    initialShowDriveBrowser = false,
    forceModal = false,
    spaceId,
}: FilesManagementViewProps) => {
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const { viewportWidth } = useActiveBreakpoint();
    const [modalProps, openModal] = useModalState({ onClose: onClose });
    // const linkWarningModal = useModalStateObject();

    // Get current provisional attachments
    const currentAttachments = useLumoSelector(selectProvisionalAttachments);

    const isSmallScreen = viewportWidth['<=small'];
    const shouldShowModal = isSmallScreen || forceModal;

    const handleViewFile = (attachment: Attachment) => {
        setFileToView(attachment);
    };

    const handleCloseFileView = () => {
        setFileToView(null);
    };

    useEffect(() => {
        if (shouldShowModal) {
            openModal(true);
        }
    }, [shouldShowModal]);

    // Determine title based on whether we're filtering
    // const title = c('collider_2025: Info').t`Knowledge Base`;

    return (
        <>
            {shouldShowModal ? (
                <ModalTwo size="large" className="files-management-modal" {...modalProps}>
                    <ModalTwoContent className="pt-3" style={{ height: '50vh' }}>
                        <KnowledgeBasePanel
                            messageChain={messageChain}
                            filesContainerRef={filesContainerRef}
                            onClose={modalProps.onClose}
                            isModal={true}
                            onViewFile={handleViewFile}
                            currentAttachments={currentAttachments}
                            filterMessage={filterMessage}
                            onClearFilter={onClearFilter}
                            initialShowDriveBrowser={initialShowDriveBrowser}
                            spaceId={spaceId}
                        />
                    </ModalTwoContent>
                </ModalTwo>
            ) : (
                <KnowledgeBasePanel
                    messageChain={messageChain}
                    filesContainerRef={filesContainerRef}
                    onClose={onClose}
                    isModal={false}
                    onViewFile={handleViewFile}
                    currentAttachments={currentAttachments}
                    filterMessage={filterMessage}
                    onClearFilter={onClearFilter}
                    initialShowDriveBrowser={initialShowDriveBrowser}
                    spaceId={spaceId}
                />
            )}
            {/* {linkWarningModal.render && (
                <LinkWarningModal
                    {...linkWarningModal.modalProps}
                    url={currentLink}
                    onClose={linkWarningModal.modalProps.onClose}
                />
            )} */}
            {fileToView && (
                <FileContentModal attachment={fileToView} onClose={handleCloseFileView} open={!!fileToView} />
            )}
        </>
    );
};

import React, { useEffect, useState } from 'react';

import { ModalTwo, ModalTwoContent, useActiveBreakpoint, useModalState, useModalStateObject } from '@proton/components';

import { useLumoSelector } from '../../../../redux/hooks';
import { selectProvisionalAttachments } from '../../../../redux/selectors';
import type { Attachment, Message } from '../../../../types';
import LinkWarningModal from '../../LumoMarkdown/LinkWarningModal';
import { FileContentModal } from './FileContentModal';
import { FilesPanel } from './FilesPanel';

import './FilesPanel.scss';

interface FilesManagementViewProps {
    messageChain: Message[];
    filesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    filterMessage?: Message; // Optional message to filter by
    onClearFilter?: () => void; // Optional callback to clear the filter
    initialShowDriveBrowser?: boolean; // Whether to show Drive browser initially
    forceModal?: boolean; // Force modal mode regardless of screen size
}

export const FilesManagementView = ({
    messageChain,
    filesContainerRef,
    onClose,
    filterMessage,
    onClearFilter,
    initialShowDriveBrowser = false,
    forceModal = false,
}: FilesManagementViewProps) => {
    const [currentLink, setCurrentLink] = useState<string>('');
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const { viewportWidth } = useActiveBreakpoint();
    const [modalProps, openModal] = useModalState({ onClose: onClose });
    const linkWarningModal = useModalStateObject();

    // Get current provisional attachments
    const currentAttachments = useLumoSelector(selectProvisionalAttachments);

    const isSmallScreen = viewportWidth['<=small'];
    const shouldShowModal = isSmallScreen || forceModal;

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        setCurrentLink(href);
        linkWarningModal.openModal(true);
    };

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
                        <FilesPanel
                            messageChain={messageChain}
                            filesContainerRef={filesContainerRef}
                            onClose={onClose}
                            handleLinkClick={handleLinkClick}
                            isModal={true}
                            onViewFile={handleViewFile}
                            currentAttachments={currentAttachments}
                            filterMessage={filterMessage}
                            onClearFilter={onClearFilter}
                            initialShowDriveBrowser={initialShowDriveBrowser}
                        />
                    </ModalTwoContent>
                </ModalTwo>
            ) : (
                <FilesPanel
                    messageChain={messageChain}
                    filesContainerRef={filesContainerRef}
                    onClose={onClose}
                    handleLinkClick={handleLinkClick}
                    isModal={false}
                    onViewFile={handleViewFile}
                    currentAttachments={currentAttachments}
                    filterMessage={filterMessage}
                    onClearFilter={onClearFilter}
                    initialShowDriveBrowser={initialShowDriveBrowser}
                />
            )}
            {linkWarningModal.render && (
                <LinkWarningModal
                    {...linkWarningModal.modalProps}
                    url={currentLink}
                    onClose={linkWarningModal.modalProps.onClose}
                />
            )}
            {fileToView && (
                <FileContentModal attachment={fileToView} onClose={handleCloseFileView} open={!!fileToView} />
            )}
        </>
    );
};

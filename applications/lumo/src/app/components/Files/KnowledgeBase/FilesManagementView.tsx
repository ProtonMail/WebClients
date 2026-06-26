import React from 'react';

import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent } from '@proton/components';

import { useLumoSelector } from '../../../redux/hooks';
import { selectProvisionalAttachments } from '../../../redux/selectors';
import type { Message } from '../../../types';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';

import './KnowledgeBasePanel.scss';

interface FilesManagementViewProps {
    messageChain: Message[];
    filesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    filterMessage?: Message;
    onClearFilter?: () => void;
    initialShowDriveBrowser?: boolean;
    /** When true, renders as a centred modal overlay (e.g. on the main/home page). */
    forceModal?: boolean;
    /** Required when forceModal is true so the ModalTwo open/close lifecycle is properly controlled. */
    modalProps?: ModalStateProps;
    spaceId?: string;
}

export const FilesManagementView = ({
    messageChain,
    filesContainerRef,
    onClose,
    filterMessage,
    onClearFilter,
    initialShowDriveBrowser = false,
    forceModal = false,
    modalProps,
    spaceId,
}: FilesManagementViewProps) => {
    const currentAttachments = useLumoSelector(selectProvisionalAttachments);

    const panel = (
        <KnowledgeBasePanel
            messageChain={messageChain}
            filesContainerRef={filesContainerRef}
            onClose={onClose}
            isModal={true}
            currentAttachments={currentAttachments}
            filterMessage={filterMessage}
            onClearFilter={onClearFilter}
            initialShowDriveBrowser={initialShowDriveBrowser}
            spaceId={spaceId}
        />
    );

    if (forceModal) {
        // Prefer the controlled modalProps so the X button (which calls onClose)
        // can correctly drive the ModalTwo open/exit lifecycle. Fall back to a
        // hardcoded `open` only if no modalProps were provided, but always wire
        // up onClose so the host can react to close requests.
        const resolvedModalProps: Partial<ModalStateProps> = modalProps ?? { open: true, onClose };

        return (
            <ModalTwo {...resolvedModalProps} size="large">
                <ModalTwoContent className="p-0 overflow-hidden" style={{ height: '70vh' }}>
                    {panel}
                </ModalTwoContent>
            </ModalTwo>
        );
    }

    return panel;
};

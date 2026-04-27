import React from 'react';

import { ModalTwo, ModalTwoContent } from '@proton/components';

import { RightDrawer } from '../../RightDrawer';
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
        return (
            <ModalTwo open onClose={onClose} size="large">
                <ModalTwoContent className="p-0 overflow-hidden" style={{ height: '70vh' }}>
                    {panel}
                </ModalTwoContent>
            </ModalTwo>
        );
    }

    return <RightDrawer>{panel}</RightDrawer>;
};

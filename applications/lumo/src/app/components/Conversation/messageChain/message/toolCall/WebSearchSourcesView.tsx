import React, { useState } from 'react';

import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';

import type { Message } from '../../../../../types';
import { RightDrawer } from '../../../../RightDrawer';
import { ToolCallInfo } from './ToolCallInfo';
import LinkWarningModal from "../../../../Modals/LinkWarningModal";

interface WebSearchSourcesViewProps {
    message: Message;
    sourcesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
}

export const WebSearchSourcesView = ({ message, sourcesContainerRef, onClose }: WebSearchSourcesViewProps) => {
    const [currentLink, setCurrentLink] = useState<string>('');
    const linkWarningModal = useModalStateObject();

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        setCurrentLink(href);
        linkWarningModal.openModal(true);
    };

    return (
        <>
            <RightDrawer>
                <div className="flex flex-column flex-nowrap h-full p-4" ref={sourcesContainerRef}>
                    <div className="flex flex-row flex-nowrap items-center justify-space-between mb-4 shrink-0">
                        <p className="m-0 text-lg text-bold">{c('collider_2025: Web Search').t`Sources`}</p>
                    </div>
                    <div className="flex flex-1 overflow-y-auto">
                        <ToolCallInfo
                            toolCall={message.toolCall}
                            toolResult={message.toolResult}
                            handleLinkClick={handleLinkClick}
                        />
                    </div>
                </div>
            </RightDrawer>
            {linkWarningModal.render && (
                <LinkWarningModal
                    {...linkWarningModal.modalProps}
                    url={currentLink}
                    onClose={linkWarningModal.modalProps.onClose}
                />
            )}
        </>
    );
};

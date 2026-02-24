import { useEffect, useState } from 'react';

import { c } from 'ttag';

import {
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useActiveBreakpoint,
    useModalState,
    useModalStateObject,
} from '@proton/components';

import type { Message } from '../../../../../types';
import { SourcesPanel } from './SourcesPanel';
import { ToolCallInfo } from './ToolCallInfo';
import LinkWarningModal from "../../../../Modals/LinkWarningModal";

interface WebSearchSourcesViewProps {
    message: Message;
    sourcesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
}

export const WebSearchSourcesView = ({ message, sourcesContainerRef, onClose }: WebSearchSourcesViewProps) => {
    const [currentLink, setCurrentLink] = useState<string>('');
    const { viewportWidth } = useActiveBreakpoint();
    const [modalProps, openModal] = useModalState({ onClose: onClose });
    const linkWarningModal = useModalStateObject();

    const isSmallScreen = viewportWidth['<=small'];

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        setCurrentLink(href);
        linkWarningModal.openModal(true);
    };

    useEffect(() => {
        if (isSmallScreen) {
            openModal(true);
        }
    }, [isSmallScreen]);

    return (
        <>
            {isSmallScreen ? (
                <ModalTwo {...modalProps}>
                    <ModalTwoHeader title={c('collider_2025: Web Search').t`Sources`} />
                    <ModalTwoContent>
                        <ToolCallInfo
                            toolCall={message.toolCall}
                            toolResult={message.toolResult}
                            handleLinkClick={handleLinkClick}
                        />
                    </ModalTwoContent>
                </ModalTwo>
            ) : (
                <SourcesPanel
                    message={message}
                    sourcesContainerRef={sourcesContainerRef}
                    onClose={onClose}
                    handleLinkClick={handleLinkClick}
                />
            )}
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

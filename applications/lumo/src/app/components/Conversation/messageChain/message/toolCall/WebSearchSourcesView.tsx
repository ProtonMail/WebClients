import React, { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useModalStateObject } from '@proton/components';

import { getMessageBlocks } from '../../../../../messageHelpers';
import type { Message } from '../../../../../types';
import { isTrustedProtonLink, openTrustedLink } from '../../../../../util/trustedLinks';
import { useNativeComposerVisibilityApi } from '../../../../Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../../../LumoIcon/LumoIcon';
import LinkWarningModal from '../../../../Modals/LinkWarningModal';
import { ToolCallInfo } from './ToolCallInfo';
import { extractSearchResults } from './toolCallUtils';

interface WebSearchSourcesViewProps {
    message: Message;
    sourcesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
}

export const WebSearchSourcesView = ({ message, sourcesContainerRef, onClose }: WebSearchSourcesViewProps) => {
    useNativeComposerVisibilityApi({ hideComposer: true });
    const [currentLink, setCurrentLink] = useState<string>('');
    const linkWarningModal = useModalStateObject();
    const searchResults = useMemo(
        () => extractSearchResults(getMessageBlocks(message)),
        [message.blocks, message.toolCall, message.toolResult]
    );

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();

        if (isTrustedProtonLink(href)) {
            openTrustedLink(href);
            return;
        }

        setCurrentLink(href);
        linkWarningModal.openModal(true);
    };

    return (
        <>
            <div className="flex flex-column flex-nowrap h-full p-4" ref={sourcesContainerRef}>
                <div className="flex flex-row flex-nowrap items-center justify-space-between mb-4 shrink-0">
                    <p className="m-0 text-lg text-bold">{c('collider_2025: Web Search').t`Sources`}</p>
                    <Button
                        icon
                        className="shrink-0"
                        size="small"
                        shape="ghost"
                        onClick={onClose}
                        title={c('collider_2025: Web Search').t`Close`}
                        aria-label={c('collider_2025: Web Search').t`Close`}
                    >
                        <LumoIcon name="X" size={16} />
                    </Button>
                </div>
                <div className="flex flex-1 overflow-y-auto">
                    {searchResults && <ToolCallInfo results={searchResults} handleLinkClick={handleLinkClick} />}
                </div>
            </div>
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

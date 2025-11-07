import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import type { Message } from '../../../../../types';
import { ToolCallInfo } from './ToolCallInfo';

interface SourcesPanelProps {
    message: Message;
    sourcesContainerRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}
export const SourcesPanel = ({ message, sourcesContainerRef, onClose, handleLinkClick }: SourcesPanelProps) => {
    return (
        <div className="sources-panel h-full w-1/4 pt-2 pr-4 pb-6" ref={sourcesContainerRef}>
            <div className="flex flex-column flex-nowrap w-full rounded-xl p-4 bg-weak shadow-lifted w-full h-full">
                <div className="flex flex-row flex-nowrap items-center justify-space-between">
                    <p className="m-0 text-lg text-bold">{c('collider_2025: Web Search').t`Sources`}</p>
                    <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                        <IcChevronRight />
                    </Button>
                </div>
                <div className=" flex flex-1 overflow-y-auto">
                    <ToolCallInfo
                        toolCall={message.toolCall}
                        toolResult={message.toolResult}
                        handleLinkClick={handleLinkClick}
                    />
                </div>
            </div>
        </div>
    );
};

import { useCallback, useRef, useState } from 'react';

import clsx from 'clsx';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { HandleEditMessage, HandleRegenerateMessage, HandleSendMessage } from '../../hooks/useLumoActions';
import { tryParseToolCall } from '../../lib/toolCall/types';
import { useLumoSelector } from '../../redux/hooks';
import type { ConversationError } from '../../redux/slices/meta/errors';
import { selectConversationErrors, selectTierErrors } from '../../redux/slices/meta/errors';
import type { Conversation, Message, SiblingInfo } from '../../types';
import ErrorCard from '../components/ErrorCard';
import { FilesManagementView } from '../components/Files';
import UpsellCard from '../components/UpsellCard';
import { ComposerComponent } from './composer/ComposerComponent';
import { ConversationHeader } from './messageChain/ConversationHeader';
import { MessageChainComponent } from './messageChain/MessageChainComponent';
import { WebSearchSourcesView } from './messageChain/message/toolCall/WebSearchSourcesView';

import './ConversationComponent.scss';

interface ConversationComponentProps {
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
    handleSendMessage: HandleSendMessage;
    handleRegenerateMessage: HandleRegenerateMessage;
    handleEditMessage: HandleEditMessage;
    handleAbort?: () => void;
    isGenerating?: boolean;
    isProcessingAttachment: boolean;
    messageChain: Message[];
    conversation?: Conversation;
    getSiblingInfo: (message: Message) => SiblingInfo;
    handleRetryGeneration: (error: ConversationError) => void;
    isWebSearchButtonToggled: boolean;
    onToggleWebSearch: () => void;
}

const ConversationComponent = ({
    messageChainRef,
    messageChain,
    conversation,
    handleEditMessage,
    handleRegenerateMessage,
    handleSendMessage,
    handleAbort,
    getSiblingInfo,
    isGenerating,
    isProcessingAttachment,
    handleRetryGeneration,
    isWebSearchButtonToggled,
    onToggleWebSearch,
}: ConversationComponentProps) => {
    const sourcesContainerRef = useRef<HTMLDivElement>(null);
    const filesContainerRef = useRef<HTMLDivElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const [openPanel, setOpenPanel] = useState<{
        type: 'sources' | 'files' | null;
        message?: Message;
        filterMessage?: Message;
        autoShowDriveBrowser?: boolean;
    }>({ type: null });

    const conversationId = conversation?.id;
    const isGeneratingWithToolCall = isGenerating
        ? !!tryParseToolCall(messageChain[messageChain.length - 1]?.toolCall ?? '')
        : undefined;

    const conversationErrors = useLumoSelector((state) =>
        conversationId ? selectConversationErrors(state, conversationId) : []
    );
    const tierErrors = useLumoSelector(selectTierErrors);

    const handleOpenSources = useCallback((message: Message) => {
        // Toggle sources panel - if same message, close it, otherwise open it
        setOpenPanel((prev) =>
            prev.type === 'sources' && prev.message === message ? { type: null } : { type: 'sources', message }
        );
    }, []);

    const handleOpenFiles = useCallback((message?: Message) => {
        // Open files panel - always close any other panel first
        // When called without a message (like from attachment area), explicitly clear any existing filter
        if (message) {
            // Opening with a specific message filter
            setOpenPanel({ type: 'files', filterMessage: message });
        } else {
            // Opening without a filter - explicitly clear any existing filter
            setOpenPanel({ type: 'files', filterMessage: undefined });
        }
    }, []);

    const handleShowDriveBrowser = useCallback(() => {
        // Open files panel and automatically show Drive browser
        setOpenPanel({ type: 'files', filterMessage: undefined, autoShowDriveBrowser: true });
    }, []);

    const handleCloseFiles = useCallback(() => {
        setOpenPanel({ type: null });
    }, []);

    const handleClearFilter = useCallback(() => {
        // Keep files panel open but remove the filter
        setOpenPanel((prev) => (prev.type === 'files' ? { type: 'files', filterMessage: undefined } : prev));
    }, []);

    return (
        <>
            {conversation && (
                <ConversationHeader
                    conversation={conversation}
                    messageChain={messageChain}
                    onOpenFiles={handleOpenFiles}
                />
            )}
            <div
                className={clsx(
                    'lumo-chat-container flex flex-row flex-nowrap flex-1 relative reset4print overflow-hidden',
                    openPanel.type === 'sources' && 'lumo-chat-container-with-sources',
                    openPanel.type === 'files' && 'lumo-chat-container-with-knowledge-base'
                )}
            >
                <div className="outer flex flex-column flex-nowrap flex-1 reset4print">
                    <MessageChainComponent
                        messageChainRef={messageChainRef}
                        messageChain={messageChain}
                        handleRegenerateMessage={handleRegenerateMessage}
                        handleEditMessage={handleEditMessage}
                        getSiblingInfo={getSiblingInfo}
                        isGenerating={isGenerating}
                        isGeneratingWithToolCall={isGeneratingWithToolCall}
                        sourcesContainerRef={sourcesContainerRef}
                        handleOpenSources={handleOpenSources}
                        handleOpenFiles={handleOpenFiles}
                        isWebSearchButtonToggled={isWebSearchButtonToggled}
                    />
                    {/* TODO: update to show all conversations errors at some point */}
                    {conversationErrors.length > 0 && (
                        <ErrorCard error={conversationErrors[0]} index={0} onRetry={handleRetryGeneration} />
                    )}
                    {tierErrors.length > 0 && <UpsellCard error={tierErrors[0]} />}
                    <div
                        className="lumo-chat-item flex flex-column w-full md:w-2/3 mx-auto max-w-custom no-print"
                        style={{
                            '--max-w-custom': '51.25rem',
                        }}
                    >
                        <ComposerComponent
                            handleSendMessage={handleSendMessage}
                            onAbort={handleAbort}
                            isGenerating={isGenerating}
                            isProcessingAttachment={isProcessingAttachment}
                            inputContainerRef={inputContainerRef}
                            isWebSearchButtonToggled={isWebSearchButtonToggled}
                            onToggleWebSearch={onToggleWebSearch}
                            messageChain={messageChain}
                            handleOpenFiles={handleOpenFiles}
                            onShowDriveBrowser={handleShowDriveBrowser}
                        />
                    </div>
                    <p className="text-center relative color-weak text-xs my-2 hidden md:block">
                        {c('collider_2025: Disclosure')
                            .t`${LUMO_SHORT_APP_NAME} can make mistakes. Please double-check responses.`}
                    </p>
                </div>
                {openPanel.type === 'sources' && openPanel.message && (
                    <WebSearchSourcesView
                        message={openPanel.message}
                        sourcesContainerRef={sourcesContainerRef}
                        onClose={() => setOpenPanel({ type: null })}
                    />
                )}
                {openPanel.type === 'files' && (
                    <FilesManagementView
                        messageChain={messageChain}
                        filesContainerRef={filesContainerRef}
                        onClose={handleCloseFiles}
                        filterMessage={openPanel.filterMessage}
                        onClearFilter={handleClearFilter}
                        initialShowDriveBrowser={openPanel.autoShowDriveBrowser}
                    />
                )}
            </div>
        </>
    );
};

export default ConversationComponent;

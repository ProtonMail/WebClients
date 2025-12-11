import React, { useCallback, useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { HandleEditMessage, HandleRegenerateMessage, HandleSendMessage } from '../../hooks/useLumoActions';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoSelector } from '../../redux/hooks';
import type { ConversationError } from '../../redux/slices/meta/errors';
import { selectConversationErrors, selectTierErrors } from '../../redux/slices/meta/errors';
import type { Conversation, Message, RetryStrategy, SiblingInfo } from '../../types';
import ErrorCard from '../components/ErrorCard';
import { FilesManagementView } from '../components/Files';
import { RetryPanel } from '../components/RetryPanel';
import UpsellCard from '../components/UpsellCard';
import { ComposerComponent } from './composer/ComposerComponent';
import { ConversationHeader } from './messageChain/ConversationHeader';
import { MessageChainComponent } from './messageChain/MessageChainComponent';
import { WebSearchSourcesView } from './messageChain/message/toolCall/WebSearchSourcesView';

import './ConversationComponent.scss';

// Floating Retry Panel Component
interface FloatingRetryPanelProps {
    buttonRef: HTMLElement;
    onRetry: (retryStrategy: RetryStrategy, customInstructions?: string) => void;
    onClose: () => void;
}

const FloatingRetryPanel = ({ buttonRef, onRetry, onClose }: FloatingRetryPanelProps) => {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    // Calculate position immediately when component mounts
    useEffect(() => {
        if (buttonRef) {
            const calculatePosition = () => {
                const rect = buttonRef.getBoundingClientRect();
                const panelWidth = 320; // Approximate width of the retry panel
                const panelHeight = 200; // Approximate height of the retry panel

                // Position above the button by default
                let top = rect.top - panelHeight - 8;
                let left = rect.left + rect.width / 2 - panelWidth / 2;

                // Adjust if panel would go off screen
                if (top < 0) {
                    top = rect.bottom + 8; // Position below the button instead
                }
                if (left < 8) {
                    left = 8;
                } else if (left + panelWidth > window.innerWidth - 8) {
                    left = window.innerWidth - panelWidth - 8;
                }

                return { top, left };
            };

            // Calculate position immediately
            setPosition(calculatePosition());
        }
    }, [buttonRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (buttonRef && !buttonRef.contains(target)) {
                const panel = document.querySelector('.floating-retry-panel');
                if (panel && !panel.contains(target)) {
                    onClose();
                }
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [buttonRef, onClose]);

    // Don't render until position is calculated to prevent flicker
    if (!position) {
        return null;
    }

    return (
        <div
            className="floating-retry-panel fixed z-50 bg-norm border border-weak rounded-xl shadow-lifted"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: '320px',
                opacity: 1,
                transition: 'opacity 150ms ease-in-out',
            }}
        >
            <RetryPanel onRetry={onRetry} className="border-none shadow-none" />
        </div>
    );
};

export interface ConversationComponentProps {
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
    initialQuery?: string;
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
    initialQuery,
}: ConversationComponentProps) => {
    const sourcesContainerRef = useRef<HTMLDivElement>(null);
    const filesContainerRef = useRef<HTMLDivElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const { isWebSearchButtonToggled } = useWebSearch();
    const [openPanel, setOpenPanel] = useState<{
        type: 'sources' | 'files' | null;
        message?: Message;
        filterMessage?: Message;
        autoShowDriveBrowser?: boolean;
    }>({ type: null });

    // Retry panel state
    const [retryPanelState, setRetryPanelState] = useState<{
        messageId: string | null;
        show: boolean;
        buttonRef: HTMLElement | null;
    }>({ messageId: null, show: false, buttonRef: null });

    const composerContainerRef = useRef<HTMLDivElement>(null);

    const conversationId = conversation?.id;

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

    // Retry panel handlers
    const handleRetryPanelToggle = useCallback((messageId: string, show: boolean, buttonRef?: HTMLElement) => {
        setRetryPanelState({
            messageId,
            show,
            buttonRef: buttonRef || null,
        });
    }, []);

    const handleRetryPanelClose = useCallback(() => {
        setRetryPanelState({ messageId: null, show: false, buttonRef: null });
    }, []);

    const handleRetry = useCallback(
        (retryStrategy: RetryStrategy, customInstructions?: string) => {
            if (retryPanelState.messageId) {
                const message = messageChain.find((m) => m.id === retryPanelState.messageId);
                if (message) {
                    void handleRegenerateMessage(message, isWebSearchButtonToggled, retryStrategy, customInstructions);
                }
            }
            handleRetryPanelClose();
        },
        [
            retryPanelState.messageId,
            messageChain,
            handleRegenerateMessage,
            isWebSearchButtonToggled,
            handleRetryPanelClose,
        ]
    );

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
                        sourcesContainerRef={sourcesContainerRef}
                        handleOpenSources={handleOpenSources}
                        handleOpenFiles={handleOpenFiles}
                        onRetryPanelToggle={handleRetryPanelToggle}
                        composerContainerRef={composerContainerRef}
                    />
                    {/* TODO: update to show all conversations errors at some point */}
                    {conversationErrors.length > 0 && (
                        <ErrorCard error={conversationErrors[0]} index={0} onRetry={handleRetryGeneration} />
                    )}
                    {tierErrors.length > 0 && <UpsellCard error={tierErrors[0]} />}
                    <div
                        ref={composerContainerRef}
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
                            messageChain={messageChain}
                            handleOpenFiles={handleOpenFiles}
                            onShowDriveBrowser={handleShowDriveBrowser}
                            initialQuery={initialQuery}
                            spaceId={conversation?.spaceId}
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
                        spaceId={conversation?.spaceId}
                    />
                )}
            </div>

            {/* Floating Retry Panel */}
            {retryPanelState.show && retryPanelState.buttonRef && (
                <FloatingRetryPanel
                    buttonRef={retryPanelState.buttonRef}
                    onRetry={handleRetry}
                    onClose={handleRetryPanelClose}
                />
            )}
        </>
    );
};

export default ConversationComponent;

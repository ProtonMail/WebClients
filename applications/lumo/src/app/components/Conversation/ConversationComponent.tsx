import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { clsx } from 'clsx';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { HtmlPreviewContext } from '../../contexts/HtmlPreviewContext';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useConversationActions } from '../../providers/ConversationActionsProvider';
import { useRightPanel } from '../../providers/RightPanelProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversationErrors, selectTierErrors } from '../../redux/slices/meta/errors';
import { type Attachment, ComposerMode, type Conversation, type Message, type RetryStrategy } from '../../types';
import UpsellCard from '../../upsells/components/UpsellCard';
import { ComposerComponent } from '../Composer/ComposerComponent';
import { FilesManagementView } from '../Files';
import { FilePreviewPanel } from '../Files/Common/FilePreviewPanel';
import ErrorCard from '../Notifications/ErrorCard';
import { RetryPanel } from '../RetryPanel';
import { ConversationSurvey } from '../Survey/ConversationSurvey';
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
    isGenerating?: boolean;
    isProcessingAttachment: boolean;
    conversation?: Conversation;
    initialQuery?: string;
    prefillQuery?: string;
    /**
     * Renders the agent surface (used by the `/agent` chatbot route): strips the conversation
     * down to its essentials (a compact header with just the agent name, no
     * favorite/knowledge-files actions, and no survey or upsell cards). The message list and
     * composer stay fully functional. Matches the `isAgent` prop on {@link ComposerComponent}.
     */
    isAgent?: boolean;
}

const ConversationComponent = ({
    conversation,
    isGenerating,
    isProcessingAttachment,
    initialQuery,
    prefillQuery,
    isAgent = false,
}: ConversationComponentProps) => {
    const {
        handleSendMessage,
        handleAbort,
        handleEditMessage,
        handleRegenerateMessage,
        getSiblingInfo,
        handleRetryGeneration,
        messageChain,
        messageChainRef,
    } = useConversationActions();
    const sourcesContainerRef = useRef<HTMLDivElement>(null);
    const filesContainerRef = useRef<HTMLDivElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const { isWebSearchButtonToggled } = useWebSearch();
    const { open: openRightPanel } = useRightPanel();
    const [openPanel, setOpenPanel] = useState<{
        type: 'sources' | 'files' | 'file-preview' | 'html-preview' | null;
        message?: Message;
        filterMessage?: Message;
        autoShowDriveBrowser?: boolean;
        attachment?: Attachment;
        htmlContent?: string;
    }>({ type: 'files' });
    // const [isHtmlPreviewFullscreen, setIsHtmlPreviewFullscreen] = useState(false);

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

    const handleOpenSources = useCallback(
        (message: Message) => {
            setOpenPanel((prev) =>
                prev.type === 'sources' && prev.message === message ? { type: null } : { type: 'sources', message }
            );
            openRightPanel();
        },
        [openRightPanel]
    );

    const handleOpenFiles = useCallback(
        (message?: Message) => {
            if (message) {
                setOpenPanel({ type: 'files', filterMessage: message });
            } else {
                setOpenPanel((prev) =>
                    prev.type === 'files' && !prev.filterMessage
                        ? { type: null }
                        : { type: 'files', filterMessage: undefined }
                );
            }
            openRightPanel();
        },
        [openRightPanel]
    );

    const handleShowDriveBrowser = useCallback(() => {
        setOpenPanel({ type: 'files', filterMessage: undefined, autoShowDriveBrowser: true });
        openRightPanel();
    }, [openRightPanel]);

    const handleCloseFiles = useCallback(() => {
        setOpenPanel({ type: null });
    }, []);

    const handleOpenFilePreview = useCallback(
        (attachment: Attachment) => {
            setOpenPanel({ type: 'file-preview', attachment });
            openRightPanel();
        },
        [openRightPanel]
    );

    const handleOpenHtmlPreview = useCallback((html: string) => {
        setOpenPanel({ type: 'html-preview', htmlContent: html });
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
        async (retryStrategy: RetryStrategy, customInstructions?: string) => {
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

    // const handleHtmlPreviewRetry = useCallback(
    //     (error: string) => {
    //         const lastAssistantMessage = [...messageChain].reverse().find((m) => m.role === Role.Assistant);
    //         if (lastAssistantMessage) {
    //             void handleRegenerateMessage(
    //                 lastAssistantMessage,
    //                 isWebSearchButtonToggled,
    //                 'custom',
    //                 c('collider_2025:Conversation').t`The HTML you generated has a rendering error: "${error}". Please fix the HTML to resolve this issue.`
    //             );
    //         }
    //     },
    //     [messageChain, handleRegenerateMessage, isWebSearchButtonToggled]
    // );

    // Memoize the action button to prevent re-renders
    // const drawerActionButton = useMemo(
    //     () => (
    //         <Button
    //             onClick={handleShowDriveBrowser}
    //             icon
    //             shape="ghost"
    //             color="weak"
    //             size="small"
    //             title={c('collider_2025:Button').t`Add files from Drive`}
    //         >
    //             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    //                 <path
    //                     d="M8 3.33331V12.6666M3.33333 7.99998H12.6667"
    //                     stroke="currentColor"
    //                     strokeWidth="1.33333"
    //                     strokeLinecap="round"
    //                     strokeLinejoin="round"
    //                 />
    //             </svg>
    //         </Button>
    //     ),
    //     [handleShowDriveBrowser]
    // );

    const drawerTitle = useMemo(() => {
        switch (openPanel.type) {
            case 'sources':
                return c('collider_2025:Title').t`Sources`;
            case 'files':
                return c('collider_2025:Title').t`Chat knowledge`;
            case 'file-preview':
                return c('collider_2025:Title').t`File preview`;
        }
    }, [openPanel.type]);

    return (
        <HtmlPreviewContext.Provider value={{ onPreviewHtml: handleOpenHtmlPreview }}>
            <LumoLayoutWithDrawer
                showNewChatButton={true}
                headerComponent={
                    conversation && (
                        <ConversationHeader
                            conversation={conversation}
                            messageChain={messageChain}
                            // onOpenFiles={handleOpenFiles}
                        />
                    )
                }
                drawerContentComponent={
                    <>
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
                        {openPanel.type === 'file-preview' && openPanel.attachment && (
                            <FilePreviewPanel
                                attachment={openPanel.attachment}
                                onBack={() => setOpenPanel({ type: 'files' })}
                                onClose={() => setOpenPanel({ type: null })}
                            />
                        )}
                    </>
                }
                drawerTitle={drawerTitle}
                // drawerActionButton={drawerActionButton}
            >
                <>
                    <div className="lumo-chat-container flex flex-row flex-nowrap flex-1 relative reset4print overflow-hidden gap-2">
                        <div
                        className={clsx(
                            'outer conversation-page-component flex flex-column flex-nowrap flex-1 reset4print overflow-hidden bg-norm rounded-xl',
                            isAgent && 'lumo-agent-fullwidth'
                        )}
                    >
                            {/* {conversation && !isAgent && (
                            <ConversationHeader
                                conversation={conversation}
                                messageChain={messageChain}
                                onOpenFiles={handleOpenFiles}
                            />
                        )}
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
                            handleOpenFilePreview={handleOpenFilePreview}
                            onRetryPanelToggle={handleRetryPanelToggle}
                            composerContainerRef={composerContainerRef}
                            className={isAgent ? 'pt-2 md:px-6' : undefined}
                        />
                        {/* TODO: update to show all conversations errors at some point */}
                        {conversationErrors.length > 0 && (
                            <ErrorCard error={conversationErrors[0]} index={0} onRetry={handleRetryGeneration} />
                        )}
                        {!isAgent && tierErrors.length > 0 && <UpsellCard error={tierErrors[0]} />}
                        {!isAgent && <ConversationSurvey isGenerating={isGenerating} />}
                        <div
                            ref={composerContainerRef}
                            className={clsx(
                                'lumo-chat-item flex flex-column no-print',
                                isAgent ? 'w-full px-4 md:px-6' : 'w-full md:w-2/3 mx-auto max-w-custom'
                            )}
                            style={isAgent ? undefined : ({ '--max-w-custom': '51.25rem' } as React.CSSProperties)}
                        >
                            <ComposerComponent
                                composerMode={ComposerMode.CONVERSATION}
                                handleSendMessage={handleSendMessage}
                                onAbort={handleAbort}
                                isGenerating={isGenerating}
                                isProcessingAttachment={isProcessingAttachment}
                                inputContainerRef={inputContainerRef}
                                messageChain={messageChain}
                                handleOpenFiles={handleOpenFiles}
                                onShowDriveBrowser={handleShowDriveBrowser}
                                onOpenFilePreview={handleOpenFilePreview}
                                initialQuery={initialQuery}
                                prefillQuery={prefillQuery}
                                spaceId={conversation?.spaceId}
                                canShowGuestNotificationCard={!isAgent}
                                isAgent={isAgent}
                            />
                        </div>
                        <p className="text-center relative color-weak text-xs my-2 hidden md:block">
                            {c('collider_2025: Disclosure')
                                .t`${LUMO_SHORT_APP_NAME} can make mistakes. Please double-check responses.`}
                        </p>
                    </div>
                    {/* <RightPanelSlot>
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
                        {openPanel.type === 'file-preview' && openPanel.attachment && (
                            <FilePreviewPanel
                                attachment={openPanel.attachment}
                                onBack={() => setOpenPanel({ type: 'files' })}
                                onClose={() => setOpenPanel({ type: null })}
                            />
                        )}
                    </RightPanelSlot> */}
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
            </LumoLayoutWithDrawer>
        </HtmlPreviewContext.Provider>
    );
};

export default ConversationComponent;

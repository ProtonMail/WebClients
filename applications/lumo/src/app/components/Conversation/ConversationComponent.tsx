import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { HtmlPreviewContext } from '../../contexts/HtmlPreviewContext';
import { useConversationPanelState } from '../../hooks/useConversationPanelState';
import { useRetryPanel } from '../../hooks/useRetryPanel';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useConversationActions } from '../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversationErrors, selectTierErrors } from '../../redux/slices/meta/errors';
import { ComposerMode, type Conversation, type RetryStrategy } from '../../types';
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
}

const ConversationComponent = ({
    conversation,
    isGenerating,
    isProcessingAttachment,
    initialQuery,
    prefillQuery,
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
    const composerContainerRef = useRef<HTMLDivElement>(null);

    const { isWebSearchButtonToggled } = useWebSearch();

    const {
        openPanel,
        getDrawerTitle,
        handleOpenSources,
        handleOpenFiles,
        handleShowDriveBrowser,
        handleClosePanel,
        handleOpenFilePreview,
        handleOpenHtmlPreview,
        handleClearFilter,
    } = useConversationPanelState();

    const { retryPanelState, handleRetryPanelToggle, handleRetryPanelClose, handleRetry } = useRetryPanel({
        messageChain,
        handleRegenerateMessage,
        isWebSearchButtonToggled,
    });

    const conversationId = conversation?.id;

    const conversationErrors = useLumoSelector((state) =>
        conversationId ? selectConversationErrors(state, conversationId) : []
    );
    const tierErrors = useLumoSelector(selectTierErrors);

    return (
        <HtmlPreviewContext.Provider value={{ onPreviewHtml: handleOpenHtmlPreview }}>
            <LumoLayoutWithDrawer
                showNewChatButton={true}
                headerComponent={
                    conversation && <ConversationHeader conversation={conversation} messageChain={messageChain} />
                }
                drawerContentComponent={
                    <>
                        {openPanel.type === 'sources' && openPanel.message && (
                            <WebSearchSourcesView
                                message={openPanel.message}
                                sourcesContainerRef={sourcesContainerRef}
                                onClose={handleClosePanel}
                            />
                        )}
                        {openPanel.type === 'files' && (
                            <FilesManagementView
                                messageChain={messageChain}
                                filesContainerRef={filesContainerRef}
                                onClose={handleClosePanel}
                                filterMessage={openPanel.filterMessage}
                                onClearFilter={handleClearFilter}
                                initialShowDriveBrowser={openPanel.autoShowDriveBrowser}
                                spaceId={conversation?.spaceId}
                            />
                        )}
                        {openPanel.type === 'file-preview' && openPanel.attachment && (
                            <FilePreviewPanel
                                attachment={openPanel.attachment}
                                onBack={() => handleOpenFiles()}
                                onClose={handleClosePanel}
                            />
                        )}
                    </>
                }
                drawerTitle={getDrawerTitle()}
            >
                <>
                    <div className="lumo-chat-container flex flex-row flex-nowrap flex-1 relative reset4print overflow-hidden gap-2">
                        <div className="outer conversation-page-component flex flex-column flex-nowrap flex-1 reset4print overflow-hidden bg-norm rounded-xl">
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
                            />
                            {/* TODO: update to show all conversations errors at some point */}
                            {conversationErrors.length > 0 && (
                                <ErrorCard error={conversationErrors[0]} index={0} onRetry={handleRetryGeneration} />
                            )}
                            {tierErrors.length > 0 && <UpsellCard error={tierErrors[0]} />}
                            <ConversationSurvey isGenerating={isGenerating} />
                            <div
                                ref={composerContainerRef}
                                className="lumo-chat-item flex flex-column w-full md:w-2/3 mx-auto max-w-custom no-print"
                                style={{
                                    '--max-w-custom': '51.25rem',
                                }}
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
                                    canShowGuestNotificationCard
                                />
                            </div>
                            <p className="text-center relative color-weak text-xs my-2 hidden md:block">
                                {c('collider_2025: Disclosure')
                                    .t`${LUMO_SHORT_APP_NAME} can make mistakes. Please double-check responses.`}
                            </p>
                        </div>
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

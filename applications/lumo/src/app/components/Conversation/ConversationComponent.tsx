import { useCallback, useRef, useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useConversationPanelState } from '../../hooks/useConversationPanelState';
import { useRetryPanel } from '../../hooks/useRetryPanel';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useConversationActions } from '../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversationErrors } from '../../redux/slices/meta/errors';
import { ComposerMode, type Conversation } from '../../types';
import { ComposerComponent } from '../Composer/ComposerComponent';
import { FilesManagementView } from '../Files';
import { FilePreviewPanel } from '../Files/Common/FilePreviewPanel';
import { FloatingRetryPanel } from '../FloatingRetryPanel';
import ErrorCard from '../Notifications/ErrorCard';
import { ConversationSurvey } from '../Survey/ConversationSurvey';
import { ImageLimitNotice } from './ImageLimitNotice';
import { ArtifactProvider, useArtifactContext } from './artifact/ArtifactContext';
import ArtifactPanel from './artifact/ArtifactPanel';
import { ConversationHeader } from './messageChain/ConversationHeader';
import { MessageChainComponent } from './messageChain/MessageChainComponent';
import { WebSearchSourcesView } from './messageChain/message/toolCall/WebSearchSourcesView';
import { useImageLimitInfo } from './useImageLimitInfo';

import './ConversationComponent.scss';

export interface ConversationComponentProps {
    isGenerating?: boolean;
    isProcessingAttachment: boolean;
    conversation?: Conversation;
    initialQuery?: string;
    prefillQuery?: string;
}

// Inner layout component — can access ArtifactContext
const ConversationLayout = ({
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
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { isWebSearchButtonToggled } = useWebSearch();

    const {
        openPanel,
        getDrawerTitle,
        handleOpenSources,
        handleOpenFiles,
        handleShowDriveBrowser,
        handleClosePanel,
        handleOpenFilePreview,
        handleClearFilter,
    } = useConversationPanelState();

    const { retryPanelState, handleRetryPanelToggle, handleRetryPanelClose, handleRetry } = useRetryPanel({
        messageChain,
        handleRegenerateMessage,
        isWebSearchButtonToggled,
    });

    const conversationId = conversation?.id;

    const { exceedsLimit: imageLimitExceeded } = useImageLimitInfo(messageChain);

    const conversationErrors = useLumoSelector((state) =>
        conversationId ? selectConversationErrors(state, conversationId) : []
    );

    // Artifact panel split state
    const { isPanelOpen } = useArtifactContext();
    const [panelWidthPct, setPanelWidthPct] = useState(55);

    const handleDividerMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            const startX = e.clientX;
            const startPct = panelWidthPct;

            const handleMouseMove = (ev: MouseEvent) => {
                const containerWidth = chatContainerRef.current?.clientWidth ?? window.innerWidth;
                const dx = ev.clientX - startX;
                // Moving divider right shrinks the panel; left expands it
                const deltaPct = (dx / containerWidth) * 100;
                const newPct = Math.max(25, Math.min(75, startPct - deltaPct));
                setPanelWidthPct(newPct);
            };

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [panelWidthPct]
    );

    return (
        <>
            <LumoLayoutWithDrawer
                header={{
                    showNewChatButton: true,
                    component: conversation && (
                        <ConversationHeader conversation={conversation} messageChain={messageChain} />
                    ),
                }}
                drawer={{
                    content: (
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
                                    spaceId={conversation?.spaceId}
                                />
                            )}
                        </>
                    ),
                    title: getDrawerTitle(),
                }}
            >
                <div
                    className="w-full h-full flex flex-row"
                    style={isPanelOpen ? { flex: `1 0 calc(${100 - panelWidthPct}% - 4px)` } : { flex: '1 1 auto' }}
                >
                    <div
                        ref={chatContainerRef}
                        className="lumo-chat-container flex flex-row flex-nowrap flex-1 relative reset4print overflow-hidden gap-2"
                    >
                        {/* Chat panel */}
                        <div className="outer conversation-page-component flex flex-column flex-nowrap reset4print overflow-hidden rounded-xl w-full">
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
                                conversationId={conversationId}
                                afterMessages={<DesktopApprovalCards />}
                            />
                            {/* TODO: update to show all conversations errors at some point */}
                            {conversationErrors.length > 0 && (
                                <ErrorCard error={conversationErrors[0]} index={0} onRetry={handleRetryGeneration} />
                            )}
                            <ConversationSurvey isGenerating={isGenerating} />
                            <div
                                ref={composerContainerRef}
                                className="lumo-chat-item flex flex-column no-print w-full md:w-2/3 mx-auto max-w-custom"
                                style={{ '--max-w-custom': '51.25rem' } as React.CSSProperties}
                            >
                                <ImageLimitNotice exceedsLimit={imageLimitExceeded} />
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

                        {/* Artifact split panel (desktop only) */}
                    </div>

                    {/* Floating Retry Panel */}
                    {retryPanelState.show && retryPanelState.buttonRef && (
                        <FloatingRetryPanel
                            buttonRef={retryPanelState.buttonRef}
                            onRetry={handleRetry}
                            onClose={handleRetryPanelClose}
                        />
                    )}

                    {isPanelOpen && (
                        <>
                            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                            <div
                                className="artifact-divider-handle hidden md:flex"
                                onMouseDown={handleDividerMouseDown}
                            />
                            <div
                                className="artifact-panel-container hidden md:flex flex-column overflow-hidden rounded-xl px-4 py-0"
                                style={{ flex: `0 0 ${panelWidthPct}%` }}
                            >
                                <ArtifactPanel isGenerating={isGenerating} />
                            </div>
                        </>
                    )}
                </div>
            </LumoLayoutWithDrawer>
        </>
    );
};
const ConversationComponent = (props: ConversationComponentProps) => {
    const { messageChain } = useConversationActions();
    return (
        <ArtifactProvider conversationId={props.conversation?.id} linearChain={messageChain}>
            <ConversationLayout {...props} />
        </ArtifactProvider>
    );
};

export default ConversationComponent;

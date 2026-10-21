import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useConversationPanelState } from '../../hooks/useConversationPanelState';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useRetryPanel } from '../../hooks/useRetryPanel';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useArtifactPanelHostActions } from '../../providers/ArtifactPanelHostProvider';
import { useConversationActions } from '../../providers/ConversationActionsProvider';
import { useRightPanel } from '../../providers/RightPanelProvider';
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
import { ArtifactPanelFullscreenOverlay } from './artifact/ArtifactPanelFullscreenOverlay';
import { ArtifactPanelMobileOverlay } from './artifact/ArtifactPanelMobileOverlay';
import { ArtifactPanelSlot } from './artifact/ArtifactPanelSlot';
import { getConversationArtifactsForDrawer } from './artifact/conversationArtifactDrawerList';
import { ConversationHeader } from './messageChain/ConversationHeader';
import { MessageChainComponent } from './messageChain/MessageChainComponent';
import DesktopApprovalCards from './messageChain/message/DesktopToolApproval/DesktopApprovalCards';
import { WebSearchSourcesView } from './messageChain/message/toolCall/WebSearchSourcesView';
import { useImageLimitInfo } from './useImageLimitInfo';

import './ConversationComponent.scss';

interface ConversationComponentProps {
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
    const artifactPanelContainerRef = useRef<HTMLDivElement>(null);
    const { setPanelFlexBasisPct } = useArtifactPanelHostActions();

    const { isWebSearchButtonToggled } = useWebSearch();

    const {
        openPanel,
        getDrawerTitle,
        handleOpenSources: openSourcesPanel,
        handleOpenFiles: openFilesPanel,
        handleShowDriveBrowser: showDriveBrowserPanel,
        handleShowFilesDrawer: showFilesDrawer,
        handleClosePanel,
        handleOpenFilePreview: openFilePreviewPanel,
        handleClearFilter,
    } = useConversationPanelState();

    const { close: closeRightDrawer, isOpen: isRightDrawerOpen } = useRightPanel();
    const { artifactsView: isArtifactsViewEnabled } = useLumoFlags();

    const { isPanelOpen, isFullscreen, exitFullscreen, closePanel, openArtifact, registry } = useArtifactContext();

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

    const { isSmallScreen: isArtifactMobileLayout } = useIsLumoSmallScreen();
    const [panelWidthPct, setPanelWidthPct] = useState(55);
    const panelWidthPctRef = useRef(panelWidthPct);
    panelWidthPctRef.current = panelWidthPct;
    const dragWidthPctRef = useRef(panelWidthPct);

    const drawerArtifacts = useMemo(() => {
        if (!isArtifactsViewEnabled) {
            return [];
        }
        return getConversationArtifactsForDrawer(registry);
    }, [isArtifactsViewEnabled, registry]);

    const handleOpenFiles = useCallback(
        (message?: Parameters<typeof openFilesPanel>[0]) => {
            if (isPanelOpen) {
                closePanel();
            }
            openFilesPanel(message);
        },
        [closePanel, isPanelOpen, openFilesPanel]
    );

    const handleShowDriveBrowser = useCallback(() => {
        if (isPanelOpen) {
            closePanel();
        }
        showDriveBrowserPanel();
    }, [closePanel, isPanelOpen, showDriveBrowserPanel]);

    const handleOpenFilePreview = useCallback(
        (attachment: Parameters<typeof openFilePreviewPanel>[0]) => {
            if (isPanelOpen) {
                closePanel();
            }
            openFilePreviewPanel(attachment);
        },
        [closePanel, isPanelOpen, openFilePreviewPanel]
    );

    const handleOpenSources = useCallback(
        (message: Parameters<typeof openSourcesPanel>[0]) => {
            if (isPanelOpen) {
                closePanel();
            }
            openSourcesPanel(message);
        },
        [closePanel, isPanelOpen, openSourcesPanel]
    );

    const handleOpenArtifactFromDrawer = useCallback(
        (artifactId: string) => {
            closeRightDrawer();
            openArtifact(artifactId, undefined, 'drawer');
        },
        [closeRightDrawer, openArtifact]
    );

    const handleArtifactBackToFiles = useCallback(() => {
        closePanel();
        showFilesDrawer();
    }, [closePanel, showFilesDrawer]);

    useEffect(() => {
        setPanelFlexBasisPct(panelWidthPct);
    }, [panelWidthPct, setPanelFlexBasisPct]);

    useEffect(() => {
        if (isRightDrawerOpen && isPanelOpen) {
            closePanel();
        }
    }, [closePanel, isPanelOpen, isRightDrawerOpen]);

    const applyArtifactPanelWidthPct = useCallback(
        (pct: number) => {
            setPanelFlexBasisPct(pct);
        },
        [setPanelFlexBasisPct]
    );

    const handleArtifactResizePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            e.preventDefault();
            const handle = e.currentTarget;
            const pointerId = e.pointerId;
            handle.setPointerCapture(pointerId);

            const startX = e.clientX;
            const startPct = panelWidthPctRef.current;
            dragWidthPctRef.current = startPct;

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const handlePointerMove = (ev: PointerEvent) => {
                if (ev.pointerId !== pointerId) {
                    return;
                }
                const containerWidth =
                    artifactPanelContainerRef.current?.closest('.main-layout-component')?.clientWidth ??
                    window.innerWidth;
                const dx = ev.clientX - startX;
                const deltaPct = (dx / containerWidth) * 100;
                const newPct = Math.max(25, Math.min(75, startPct - deltaPct));
                dragWidthPctRef.current = newPct;
                applyArtifactPanelWidthPct(newPct);
            };

            const cleanup = () => {
                try {
                    handle.releasePointerCapture(pointerId);
                } catch {
                    // Handle may already be unmounted.
                }
                handle.removeEventListener('pointermove', handlePointerMove);
                handle.removeEventListener('pointerup', handlePointerUp);
                handle.removeEventListener('pointercancel', handlePointerUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            const handlePointerUp = (ev: PointerEvent) => {
                if (ev.pointerId !== pointerId) {
                    return;
                }
                setPanelWidthPct(dragWidthPctRef.current);
                cleanup();
            };

            handle.addEventListener('pointermove', handlePointerMove);
            handle.addEventListener('pointerup', handlePointerUp);
            handle.addEventListener('pointercancel', handlePointerUp);
        },
        [applyArtifactPanelWidthPct]
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
                                    drawerArtifacts={drawerArtifacts}
                                    onOpenArtifact={handleOpenArtifactFromDrawer}
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
                    ref={chatContainerRef}
                    className="conversation-split-row lumo-chat-container flex flex-column flex-1 min-h-0 w-full relative reset4print overflow-hidden min-w-0"
                >
                    <div className="outer conversation-page-component flex flex-column flex-nowrap reset4print overflow-hidden rounded-xl w-full flex-1 min-h-0">
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
                </div>
                <ArtifactPanelSlot>
                    {isPanelOpen && !isArtifactMobileLayout && !isFullscreen ? (
                        <div
                            ref={artifactPanelContainerRef}
                            className="artifact-panel-container flex flex-column min-w-0 h-full w-full relative"
                        >
                            <div
                                className="artifact-panel-resize-handle"
                                onPointerDown={handleArtifactResizePointerDown}
                                aria-hidden
                            />
                            <div className="artifact-panel-content flex flex-column flex-1 min-h-0 min-w-0 overflow-hidden">
                                <ArtifactPanel isGenerating={isGenerating} onBackToFiles={handleArtifactBackToFiles} />
                            </div>
                        </div>
                    ) : null}
                </ArtifactPanelSlot>
                {retryPanelState.show && retryPanelState.buttonRef && (
                    <FloatingRetryPanel
                        buttonRef={retryPanelState.buttonRef}
                        onRetry={handleRetry}
                        onClose={handleRetryPanelClose}
                    />
                )}
                <ArtifactPanelMobileOverlay
                    isOpen={isPanelOpen && isArtifactMobileLayout}
                    isGenerating={isGenerating}
                />
                <ArtifactPanelFullscreenOverlay
                    isOpen={isPanelOpen && isFullscreen && !isArtifactMobileLayout}
                    isGenerating={isGenerating}
                    onExitFullscreen={exitFullscreen}
                />
            </LumoLayoutWithDrawer>
        </>
    );
};
const ConversationComponent = (props: ConversationComponentProps) => {
    const { messageChain } = useConversationActions();
    return (
        <ArtifactProvider
            conversationId={props.conversation?.id}
            linearChain={messageChain}
            isGenerating={props.isGenerating}
        >
            <ConversationLayout {...props} />
        </ArtifactProvider>
    );
};

export default ConversationComponent;

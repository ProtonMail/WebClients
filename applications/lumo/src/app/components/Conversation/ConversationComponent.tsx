import { useRef } from 'react';

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
import { ComposerMode, type Conversation } from '../../types';
import UpsellCard from '../../upsells/components/UpsellCard';
import { ComposerComponent } from '../Composer/ComposerComponent';
import { FilesManagementView } from '../Files';
import { FilePreviewPanel } from '../Files/Common/FilePreviewPanel';
import { FloatingRetryPanel } from '../FloatingRetryPanel';
import ErrorCard from '../Notifications/ErrorCard';
import { ConversationSurvey } from '../Survey/ConversationSurvey';
import { ConversationHeader } from './messageChain/ConversationHeader';
import { MessageChainComponent } from './messageChain/MessageChainComponent';
import { WebSearchSourcesView } from './messageChain/message/toolCall/WebSearchSourcesView';

import './ConversationComponent.scss';

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
                                />
                            )}
                        </>
                    ),
                    title: getDrawerTitle(),
                }}
            >
                <>
                    <div className="lumo-chat-container flex flex-row flex-nowrap flex-1 relative reset4print overflow-hidden gap-2">
                        <div className="outer conversation-page-component flex flex-column flex-nowrap flex-1 reset4print overflow-hidden rounded-xl">
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
                                className="lumo-chat-item flex flex-column no-print w-full md:w-2/3 mx-auto max-w-custom"
                                style={{ '--max-w-custom': '51.25rem' } as React.CSSProperties}
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

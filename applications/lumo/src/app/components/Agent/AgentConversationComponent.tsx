import { useRef } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useRetryPanel } from '../../hooks/useRetryPanel';
import { useConversationActions } from '../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversationErrors } from '../../redux/slices/meta/errors';
import { ComposerMode, type Conversation } from '../../types';
import { ComposerComponent } from '../Composer/ComposerComponent';
import { MessageChainComponent } from '../Conversation/messageChain/MessageChainComponent';
import { FloatingRetryPanel } from '../FloatingRetryPanel';
import ErrorCard from '../Notifications/ErrorCard';

export interface AgentConversationComponentProps {
    isGenerating?: boolean;
    isProcessingAttachment: boolean;
    conversation?: Conversation;
    initialQuery?: string;
    prefillQuery?: string;
}

const AgentConversationComponent = ({
    conversation,
    isGenerating,
    isProcessingAttachment,
    initialQuery,
    prefillQuery,
}: AgentConversationComponentProps) => {
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

    const inputContainerRef = useRef<HTMLDivElement>(null);
    const composerContainerRef = useRef<HTMLDivElement>(null);
    const sourcesContainerRef = useRef<HTMLDivElement>(null);

    const { isWebSearchButtonToggled } = useWebSearch();

    const { retryPanelState, handleRetryPanelToggle, handleRetryPanelClose, handleRetry } = useRetryPanel({
        messageChain,
        handleRegenerateMessage,
        isWebSearchButtonToggled,
    });

    const conversationId = conversation?.id;
    const conversationErrors = useLumoSelector((state) =>
        conversationId ? selectConversationErrors(state, conversationId) : []
    );

    return (
        <div className="flex flex-column flex-nowrap flex-1 overflow-hidden bg-norm">
            <MessageChainComponent
                messageChainRef={messageChainRef}
                messageChain={messageChain}
                handleRegenerateMessage={handleRegenerateMessage}
                handleEditMessage={handleEditMessage}
                getSiblingInfo={getSiblingInfo}
                isGenerating={isGenerating}
                sourcesContainerRef={sourcesContainerRef}
                handleOpenSources={() => {}}
                handleOpenFiles={() => {}}
                handleOpenFilePreview={() => {}}
                onRetryPanelToggle={handleRetryPanelToggle}
                composerContainerRef={composerContainerRef}
                className="pt-2 md:px-6"
            />
            {conversationErrors.length > 0 && (
                <ErrorCard error={conversationErrors[0]} index={0} onRetry={handleRetryGeneration} />
            )}
            <div ref={composerContainerRef} className="lumo-chat-item flex flex-column no-print w-full px-4 md:px-6">
                <ComposerComponent
                    composerMode={ComposerMode.CONVERSATION}
                    handleSendMessage={handleSendMessage}
                    onAbort={handleAbort}
                    isGenerating={isGenerating}
                    isProcessingAttachment={isProcessingAttachment}
                    inputContainerRef={inputContainerRef}
                    messageChain={messageChain}
                    initialQuery={initialQuery}
                    prefillQuery={prefillQuery}
                    spaceId={conversation?.spaceId}
                    canShowGuestNotificationCard={false}
                    isAgent
                />
            </div>
            <p className="text-center relative color-weak text-xs my-2 hidden md:block">
                {c('collider_2025: Disclosure')
                    .t`${LUMO_SHORT_APP_NAME} can make mistakes. Please double-check responses.`}
            </p>
            {retryPanelState.show && retryPanelState.buttonRef && (
                <FloatingRetryPanel
                    buttonRef={retryPanelState.buttonRef}
                    onRetry={handleRetry}
                    onClose={handleRetryPanelClose}
                />
            )}
        </div>
    );
};

export default AgentConversationComponent;

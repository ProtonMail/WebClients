import React, { memo } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage } from '../../../..//hooks/useLumoActions';
import type { SiblingInfo } from '../../../..//hooks/usePreferredSiblings';
import type { Message } from '../../../../types';
import { type Attachment, Role, isCompactionMessage, isManualArtifactEditMessage } from '../../../../types';
import ChatContainerItem from '../../../ChatContainerItem';
import { ArtifactEditMarker } from './ArtifactEditMarker/ArtifactEditMarker';
import AssistantMessage from './AssistantMessage/AssistantMessage';
import { CompactionMarker } from './CompactionMarker/CompactionMarker';
import UserMessage from './UserMessage/UserMessage';

export type MessageComponentProps = {
    message: Message;
    handleRegenerateMessage: HandleRegenerateMessage;
    handleEditMessage: HandleEditMessage;
    siblingInfo: SiblingInfo;
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
    sourcesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    handleOpenSources: (message: Message) => void;
    handleOpenFiles: (message?: Message) => void;
    handleOpenFilePreview: (attachment: Attachment) => void;
    messageChain: Message[];
    newMessageRef?: React.MutableRefObject<HTMLDivElement | null>;
    isLastMessage: boolean;
    isGenerating: boolean;
    onRetryPanelToggle?: (messageId: string, show: boolean, buttonRef?: HTMLElement) => void;
};

// Use deep memo comparison to prevent unnecessary re-renders
const areEqual = (prevProps: MessageComponentProps, nextProps: MessageComponentProps) => {
    // Quick reference check first
    if (
        prevProps.message === nextProps.message &&
        prevProps.siblingInfo === nextProps.siblingInfo &&
        prevProps.isLastMessage === nextProps.isLastMessage &&
        prevProps.isGenerating === nextProps.isGenerating
    ) {
        return true;
    }

    // Compare Message objects by their key properties
    const messageChanged =
        prevProps.message.id !== nextProps.message.id ||
        prevProps.message.content !== nextProps.message.content ||
        prevProps.message.placeholder !== nextProps.message.placeholder ||
        prevProps.message.status !== nextProps.message.status ||
        prevProps.message.toolCall !== nextProps.message.toolCall ||
        prevProps.message.contextFiles?.length !== nextProps.message.contextFiles?.length ||
        prevProps.message.toolResult !== nextProps.message.toolResult ||
        prevProps.message.reasoning !== nextProps.message.reasoning ||
        prevProps.message.thinkingTimeline?.length !== nextProps.message.thinkingTimeline?.length ||
        prevProps.message.suggestedQuestions?.length !== nextProps.message.suggestedQuestions?.length ||
        prevProps.message.artifactAction !== nextProps.message.artifactAction;

    // Compare siblingInfo by its key properties
    const siblingInfoChanged =
        prevProps.siblingInfo.idx !== nextProps.siblingInfo.idx ||
        prevProps.siblingInfo.count !== nextProps.siblingInfo.count;

    // Compare generation state
    const generationStateChanged =
        prevProps.isLastMessage !== nextProps.isLastMessage || prevProps.isGenerating !== nextProps.isGenerating;

    // If any of these changed, re-render
    return !messageChanged && !siblingInfoChanged && !generationStateChanged;
};

const MessageComponentPure = ({
    message,
    handleRegenerateMessage,
    handleEditMessage,
    siblingInfo,
    messageChainRef,
    sourcesContainerRef,
    handleOpenSources,
    handleOpenFiles,
    handleOpenFilePreview,
    messageChain,
    newMessageRef,
    isLastMessage,
    isGenerating,
    onRetryPanelToggle,
}: MessageComponentProps) => {
    const messageContent = message?.content;
    const isUser = message.role === Role.User;
    const isRunning = message.placeholder || false;
    const isLoading = message.placeholder && !messageContent && !message.reasoning;

    // A compaction boundary is rendered as an inline divider rather than a chat bubble.
    if (isCompactionMessage(message)) {
        return (
            <ChatContainerItem
                className="compaction-msg mb-6"
                data-message-role="compaction"
                data-message-id={message.id}
            >
                <CompactionMarker message={message} />
            </ChatContainerItem>
        );
    }

    // A manual artifact edit is a synthetic, non-generating message (no LLM turn) — rendered
    // as a small clickable divider rather than a chat bubble, same treatment as compaction.
    if (isManualArtifactEditMessage(message)) {
        return (
            <ChatContainerItem
                className="artifact-edit-msg mb-6"
                data-message-role="artifact-manual-edit"
                data-message-id={message.id}
            >
                <ArtifactEditMarker message={message} />
            </ChatContainerItem>
        );
    }

    return (
        <ChatContainerItem
            className={isUser ? 'user-msg mb-6 justify-end' : 'assistant-msg justify-start mb-6'}
            data-message-role={message.role}
            data-message-id={message.id}
        >
            {/* <div ref={newMessageRef}> */}
            {isUser ? (
                <UserMessage
                    message={message}
                    messageContent={messageContent}
                    siblingInfo={siblingInfo}
                    handleEditMessage={handleEditMessage}
                    newMessageRef={newMessageRef}
                    onOpenFilePreview={handleOpenFilePreview}
                />
            ) : (
                <>
                    <AssistantMessage
                        message={message}
                        isLoading={isLoading}
                        isRunning={isRunning}
                        messageChainRef={messageChainRef}
                        sourcesContainerRef={sourcesContainerRef}
                        handleRegenerateMessage={handleRegenerateMessage}
                        siblingInfo={siblingInfo}
                        isLastMessage={isLastMessage}
                        handleOpenSources={handleOpenSources}
                        handleOpenFiles={handleOpenFiles}
                        messageChain={messageChain}
                        isGenerating={isGenerating}
                        onToggleMessageSource={handleOpenSources}
                        onToggleFilesManagement={handleOpenFiles}
                        onRetryPanelToggle={onRetryPanelToggle}
                    />
                </>
            )}
            {/* </div> */}
        </ChatContainerItem>
    );
};

export const MessageComponent = memo(MessageComponentPure, areEqual);

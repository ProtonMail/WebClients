import React, { memo } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage } from 'applications/lumo/src/app/hooks/useLumoActions';
import type { SiblingInfo } from 'applications/lumo/src/app/hooks/usePreferredSiblings';

import type { Message } from '../../../../types';
import { Role } from '../../../../types';
import ChatContainerItem from '../../../ChatContainerItem';
import AssistantMessage from './AssistantMessage/AssistantMessage';
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
        prevProps.message.thinkingTimeline?.length !== nextProps.message.thinkingTimeline?.length;

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
                    // onOpenFiles={handleOpenFiles}
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

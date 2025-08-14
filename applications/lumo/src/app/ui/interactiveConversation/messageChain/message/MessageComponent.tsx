import React, { memo, useCallback } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage } from 'applications/lumo/src/app/hooks/useLumoActions';
import type { SiblingInfo } from 'applications/lumo/src/app/hooks/usePreferredSiblings';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import type { Message } from '../../../../types';
import { Role } from '../../../../types';
import ChatContainerItem from '../../../components/ChatContainerItem';
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
    isGeneratingWithToolCall: boolean;
    isWebSearchButtonToggled: boolean;
};

// Use deep memo comparison to prevent unnecessary re-renders
const areEqual = (prevProps: MessageComponentProps, nextProps: MessageComponentProps) => {
    // Quick reference check first
    if (
        prevProps.message === nextProps.message &&
        prevProps.siblingInfo === nextProps.siblingInfo &&
        prevProps.isLastMessage === nextProps.isLastMessage &&
        prevProps.isGenerating === nextProps.isGenerating &&
        prevProps.isGeneratingWithToolCall === nextProps.isGeneratingWithToolCall
    ) {
        return true;
    }

    // Compare Message objects by their key properties
    const messageChanged =
        prevProps.message.id !== nextProps.message.id ||
        prevProps.message.content !== nextProps.message.content ||
        prevProps.message.placeholder !== nextProps.message.placeholder ||
        prevProps.message.status !== nextProps.message.status ||
        prevProps.message.toolCall !== nextProps.message.toolCall;

    // Compare siblingInfo by its key properties
    const siblingInfoChanged =
        prevProps.siblingInfo.idx !== nextProps.siblingInfo.idx ||
        prevProps.siblingInfo.count !== nextProps.siblingInfo.count;

    // Compare generation state
    const generationStateChanged =
        prevProps.isLastMessage !== nextProps.isLastMessage ||
        prevProps.isGenerating !== nextProps.isGenerating ||
        prevProps.isGeneratingWithToolCall !== nextProps.isGeneratingWithToolCall;

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
    isGeneratingWithToolCall,
    isWebSearchButtonToggled,
}: MessageComponentProps) => {
    const messageContent = message?.content;
    const isUser = message.role === Role.User;
    const isRunning = message.placeholder || false;
    const isLoading = message.placeholder && !messageContent;

    const { createNotification } = useNotifications();
    // useAutoScroll(messageChainRef, isRunning, [message, isRunning]);

    const handleCopy = useCallback(() => {
        createNotification({
            text: c('collider_2025:Notification').t`Code copied to clipboard`,
        });
    }, [createNotification]);

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
                />
            ) : (
                <AssistantMessage
                    message={message}
                    isLoading={isLoading}
                    isRunning={isRunning}
                    messageChainRef={messageChainRef}
                    sourcesContainerRef={sourcesContainerRef}
                    handleRegenerateMessage={handleRegenerateMessage}
                    onCopy={handleCopy}
                    siblingInfo={siblingInfo}
                    isLastMessage={isLastMessage}
                    handleOpenSources={handleOpenSources}
                    handleOpenFiles={handleOpenFiles}
                    messageChain={messageChain}
                    isGenerating={isGenerating}
                    isGeneratingWithToolCall={isGeneratingWithToolCall}
                    onToggleMessageSource={handleOpenSources}
                    onToggleFilesManagement={handleOpenFiles}
                    isWebSearchButtonToggled={isWebSearchButtonToggled}
                />
            )}
            {/* </div> */}
        </ChatContainerItem>
    );
};

export const MessageComponent = memo(MessageComponentPure, areEqual);

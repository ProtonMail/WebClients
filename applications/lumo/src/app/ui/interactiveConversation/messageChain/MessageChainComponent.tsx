import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage } from '../../../hooks/useLumoActions';
import type { SiblingInfo } from '../../../hooks/usePreferredSiblings';
import { type Message } from '../../../types';
import { MessageComponent } from './message/MessageComponent';

export type MessageChainComponentProps = {
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
    sourcesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    messageChain: Message[];
    handleRegenerateMessage: HandleRegenerateMessage;
    handleEditMessage: HandleEditMessage;
    getSiblingInfo: (message: Message) => SiblingInfo;
    handleOpenSources: (message: Message) => void;
    handleOpenFiles: (message?: Message) => void;
    isGenerating?: boolean;
    isGeneratingWithToolCall?: boolean;
    isWebSearchButtonToggled: boolean;
};

const useAutoScroll = (
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>,
    messageChain: Message[],
    isGenerating?: boolean
) => {
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
    const generationScrollIntervalRef = useRef<NodeJS.Timeout>();

    const isNearBottom = useCallback(() => {
        if (!messageChainRef.current) return true;

        const container = messageChainRef.current;
        const threshold = 100; // pixels from bottom to consider "near bottom"
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        return distanceFromBottom <= threshold;
    }, [messageChainRef]);

    const handleScroll = useCallback(() => {
        if (!messageChainRef.current) return;

        const nearBottom = isNearBottom();

        if (!nearBottom) {
            setUserHasScrolledUp(true);
            // Clear the generation scroll interval if user manually scrolls
            if (generationScrollIntervalRef.current) {
                clearInterval(generationScrollIntervalRef.current);
                generationScrollIntervalRef.current = undefined;
            }
        }

        if (nearBottom && userHasScrolledUp) {
            setUserHasScrolledUp(false);
        }
    }, [isNearBottom, userHasScrolledUp]);

    const scrollToBottom = useCallback(() => {
        if (!messageChainRef.current || userHasScrolledUp) return;

        const container = messageChainRef.current;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
        });
    }, [messageChainRef, userHasScrolledUp]);

    useEffect(() => {
        const container = messageChainRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    // Continuous scroll during generation
    useEffect(() => {
        if (isGenerating && !userHasScrolledUp) {
            // Start continuous scrolling during generation
            generationScrollIntervalRef.current = setInterval(() => {
                scrollToBottom();
            }, 200);
        } else {
            // Clear interval when not generating or user has scrolled up
            if (generationScrollIntervalRef.current) {
                clearInterval(generationScrollIntervalRef.current);
                generationScrollIntervalRef.current = undefined;
            }
        }

        // Cleanup on unmount
        return () => {
            if (generationScrollIntervalRef.current) {
                clearInterval(generationScrollIntervalRef.current);
            }
        };
    }, [isGenerating, userHasScrolledUp, scrollToBottom]);

    // Initial scroll to bottom on mount and when messages first load
    useEffect(() => {
        if (messageChain.length > 0 && messageChainRef.current) {
            setTimeout(() => {
                const container = messageChainRef.current;
                if (container) {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }, 50);
        }
    }, [messageChainRef.current]);

    return { userHasScrolledUp };
};

export const MessageChainComponent = ({
    messageChain,
    messageChainRef,
    handleRegenerateMessage,
    handleEditMessage,
    getSiblingInfo,
    isGenerating,
    isGeneratingWithToolCall,
    sourcesContainerRef,
    handleOpenSources,
    handleOpenFiles,
    isWebSearchButtonToggled,
}: MessageChainComponentProps) => {
    const newMessageRef = useRef<HTMLDivElement | null>(null);

    useAutoScroll(messageChainRef, messageChain, isGenerating);

    return (
        <div
            ref={messageChainRef}
            className="lumo-message-chain h-full overflow-y-auto px-6 md:px-0 flex-1 reset4print"
        >
            {messageChain.map((message, index) => (
                <MessageComponent
                    key={message.id}
                    message={message}
                    handleRegenerateMessage={handleRegenerateMessage}
                    handleEditMessage={handleEditMessage}
                    siblingInfo={getSiblingInfo(message)}
                    messageChainRef={messageChainRef}
                    sourcesContainerRef={sourcesContainerRef}
                    handleOpenSources={handleOpenSources}
                    handleOpenFiles={handleOpenFiles}
                    messageChain={messageChain}
                    newMessageRef={index === messageChain.length - 2 ? newMessageRef : undefined}
                    isLastMessage={index === messageChain.length - 1}
                    isGenerating={isGenerating || false}
                    isGeneratingWithToolCall={isGeneratingWithToolCall || false}
                    isWebSearchButtonToggled={isWebSearchButtonToggled}
                />
            ))}
        </div>
    );
};

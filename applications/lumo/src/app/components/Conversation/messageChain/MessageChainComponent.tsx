import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage } from '../../../hooks/useLumoActions';
import type { SiblingInfo } from '../../../hooks/usePreferredSiblings';
import { type Message, Role } from '../../../types';
import { ScrollToBottomButton } from './ScrollToBottomButton/ScrollToBottomButton';
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
    onRetryPanelToggle?: (messageId: string, show: boolean, buttonRef?: HTMLElement) => void;
    composerContainerRef: React.RefObject<HTMLDivElement>;
};

interface ScrollState {
    userHasScrolledUp: boolean;
}

type ScrollAction = { type: 'USER_SCROLLED_UP' } | { type: 'REACHED_BOTTOM' };

const scrollReducer = (state: ScrollState, action: ScrollAction): ScrollState => {
    switch (action.type) {
        case 'USER_SCROLLED_UP':
            return { userHasScrolledUp: true };
        case 'REACHED_BOTTOM':
            return { userHasScrolledUp: false };
        default:
            return state;
    }
};

const useAutoScroll = (
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>,
    messageChain: Message[],
    isGenerating?: boolean
) => {
    const [scrollState, dispatch] = useReducer(scrollReducer, {
        userHasScrolledUp: false,
    });

    const isNearBottom = useCallback(() => {
        if (!messageChainRef.current) return true;

        const container = messageChainRef.current;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        return distanceFromBottom <= 100;
    }, [messageChainRef]);

    // Incremented on each button click to cancel any in-progress poll loop.
    const scrollPollGenerationRef = useRef(0);

    const scrollToBottom = useCallback(
        (instant = false) => {
            const container = messageChainRef.current;
            if (!container) return;

            container.scrollTo({
                top: container.scrollHeight,
                behavior: instant ? 'instant' : 'smooth',
            });

            if (!instant) return;

            // Each button click gets a unique generation ID. The poll loop checks this on
            // every frame and exits immediately if a newer click has superseded it.
            const generation = ++scrollPollGenerationRef.current;
            let stableFrames = 0;
            let frameCount = 0;
            let lastScrollHeight = container.scrollHeight;

            // 10 consecutive frames with the same scrollHeight (~166ms at 60fps) means
            // all async content (tables, images, PrismAsync, lazy bundles) has settled.
            const STABLE_FRAMES_NEEDED = 10;
            // Hard cap: stop after 2 seconds regardless (120 frames @ 60fps).
            const MAX_FRAMES = 120;

            // ResizeObserver watches the element's rendered box size, which does NOT
            // change for overflow-y:auto containers when content inside grows. rAF
            // polling reads scrollHeight directly on every frame, catching every source
            // of height change without needing DOM events.
            const poll = () => {
                if (scrollPollGenerationRef.current !== generation) return;

                frameCount++;
                const currentScrollHeight = container.scrollHeight;
                container.scrollTo({ top: currentScrollHeight, behavior: 'instant' });

                if (currentScrollHeight !== lastScrollHeight) {
                    stableFrames = 0;
                    lastScrollHeight = currentScrollHeight;
                } else {
                    stableFrames++;
                }

                if (stableFrames >= STABLE_FRAMES_NEEDED || frameCount >= MAX_FRAMES) return;

                requestAnimationFrame(poll);
            };

            requestAnimationFrame(poll);
        },
        [messageChainRef]
    );

    // Handle scroll - track position for floating scroll indicator (immediate response)
    const handleScroll = useCallback(() => {
        if (!messageChainRef.current) return;

        const nearBottom = isNearBottom();

        // Simple state updates for scroll indicator
        if (!nearBottom && !scrollState.userHasScrolledUp) {
            dispatch({ type: 'USER_SCROLLED_UP' });
        } else if (nearBottom && scrollState.userHasScrolledUp) {
            dispatch({ type: 'REACHED_BOTTOM' });
        }
    }, [isNearBottom, scrollState.userHasScrolledUp]);

    // Scroll to position the latest question at the top when a new question is asked
    const scrollQuestionToTopRef = useRef<(() => void) | null>(null);

    scrollQuestionToTopRef.current = () => {
        if (!messageChainRef.current || messageChain.length === 0) return;

        const container = messageChainRef.current;

        let lastUserMessageIndex = -1;
        for (let i = messageChain.length - 1; i >= 0; i--) {
            if (messageChain[i].role === Role.User) {
                lastUserMessageIndex = i;
                break;
            }
        }

        if (lastUserMessageIndex === -1) return;

        const messageElements = container.children;
        const questionElement = messageElements[lastUserMessageIndex] as HTMLElement;

        if (questionElement) {
            container.scrollTo({
                top: questionElement.offsetTop,
                behavior: 'smooth',
            });
        }
    };

    const previousGeneratingRef = useRef(isGenerating);

    useEffect(() => {
        const wasGenerating = previousGeneratingRef.current;
        previousGeneratingRef.current = isGenerating;

        // Only scroll when generation STARTS (not during streaming or when it ends)
        if (isGenerating && !wasGenerating) {
            setTimeout(() => {
                scrollQuestionToTopRef.current?.();
            }, 100);
        }
    }, [isGenerating]);

    useEffect(() => {
        const container = messageChainRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    const hasScrolledInitially = useRef(false);
    useEffect(() => {
        if (messageChain.length > 0 && messageChainRef.current && !hasScrolledInitially.current) {
            hasScrolledInitially.current = true;
            // Show the first message at the top on open. The container's default scroll
            // position is already 0, so this just ensures it's explicitly reset in case
            // the container was previously scrolled (e.g. conversation switch).
            messageChainRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [messageChain.length, messageChainRef]);

    useEffect(() => {
        return () => {
            // Cancel any in-progress poll loop on unmount.
            scrollPollGenerationRef.current++;
        };
    }, []);

    return {
        userHasScrolledUp: scrollState.userHasScrolledUp,
        scrollToBottom,
    };
};

export const MessageChainComponent = ({
    messageChain,
    messageChainRef,
    handleRegenerateMessage,
    handleEditMessage,
    getSiblingInfo,
    isGenerating,
    sourcesContainerRef,
    handleOpenSources,
    handleOpenFiles,
    onRetryPanelToggle,
    composerContainerRef,
}: MessageChainComponentProps) => {
    const newMessageRef = useRef<HTMLDivElement | null>(null);
    const { userHasScrolledUp, scrollToBottom } = useAutoScroll(messageChainRef, messageChain, isGenerating);
    const [hasNewContentBelow, setHasNewContentBelow] = useState(false);

    useEffect(() => {
        if (!messageChainRef.current) return;

        const container = messageChainRef.current;
        let previousScrollHeight = container.scrollHeight;

        const checkForNewContent = () => {
            if (!container) return;

            const currentScrollHeight = container.scrollHeight;
            const scrollTop = container.scrollTop;
            const clientHeight = container.clientHeight;
            const isAtBottom = currentScrollHeight - scrollTop - clientHeight <= 100;

            if (currentScrollHeight > previousScrollHeight && !isAtBottom && isGenerating) {
                setHasNewContentBelow(true);
            } else if (isAtBottom) {
                setHasNewContentBelow(false);
            }

            previousScrollHeight = currentScrollHeight;
        };

        if (isGenerating) {
            const observer = new MutationObserver(checkForNewContent);
            observer.observe(container, {
                childList: true,
                subtree: true,
                characterData: true,
            });

            return () => observer.disconnect();
        } else {
            setHasNewContentBelow(false);
        }
    }, [isGenerating, messageChainRef]);

    const showScrollIndicator = userHasScrolledUp || hasNewContentBelow;

    return (
        <>
            <div
                ref={messageChainRef}
                className="lumo-message-chain h-full overflow-y-auto px-6 md:px-0 flex-1 reset4print"
            >
                {messageChain.map((message, index) => {
                    const isLastMessage = index === messageChain.length - 1;

                    return (
                        <div key={message.id}>
                            <MessageComponent
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
                                isLastMessage={isLastMessage}
                                isGenerating={isGenerating || false}
                                onRetryPanelToggle={onRetryPanelToggle}
                            />
                        </div>
                    );
                })}
            </div>

            <ScrollToBottomButton
                onClick={() => scrollToBottom(true)}
                show={showScrollIndicator}
                composerContainerRef={composerContainerRef}
            />
        </>
    );
};

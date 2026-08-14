import React, { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage } from '../../../hooks/useLumoActions';
import type { SiblingInfo } from '../../../hooks/usePreferredSiblings';
import type { Attachment, ConversationId, Message } from '../../../types';
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
    handleOpenFilePreview: (attachment: Attachment) => void;
    isGenerating?: boolean;
    onRetryPanelToggle?: (messageId: string, show: boolean, buttonRef?: HTMLElement) => void;
    composerContainerRef: React.RefObject<HTMLDivElement>;
    /** Extra classes for the scrollable message container (e.g. top spacing in minimal mode). */
    className?: string;
    conversationId?: ConversationId;
    /** Host-provided content rendered right after the message list (e.g. desktop tool-approval cards). */
    afterMessages?: React.ReactNode;
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

// How long the message chain and DOM must be idle before we stop auto-scrolling on open.
// Remote pulls can trickle in messages and full bodies over many seconds.
const INITIAL_SCROLL_IDLE_MS = 1500;

const useAutoScroll = (
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>,
    messageChain: Message[],
    isGenerating?: boolean,
    conversationId?: ConversationId
) => {
    const [scrollState, dispatch] = useReducer(scrollReducer, {
        userHasScrolledUp: false,
    });
    const userHasScrolledUpRef = useRef(scrollState.userHasScrolledUp);
    const isGeneratingRef = useRef(isGenerating);
    const isPointerDownRef = useRef(false);
    const lastObservedScrollTopRef = useRef(0);

    userHasScrolledUpRef.current = scrollState.userHasScrolledUp;
    isGeneratingRef.current = isGenerating;

    // Incremented on each button click to cancel any in-progress poll loop.
    const scrollPollGenerationRef = useRef(0);

    const markUserScrolledUp = useCallback(() => {
        scrollPollGenerationRef.current++;
        if (!userHasScrolledUpRef.current) {
            userHasScrolledUpRef.current = true;
            dispatch({ type: 'USER_SCROLLED_UP' });
        }
    }, []);

    const resumeFollowing = useCallback(() => {
        userHasScrolledUpRef.current = false;
        dispatch({ type: 'REACHED_BOTTOM' });
    }, []);

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
                if (scrollPollGenerationRef.current !== generation || userHasScrolledUpRef.current) return;

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

    const resumeAutoScroll = useCallback(() => {
        resumeFollowing();
        scrollToBottom(true);
    }, [resumeFollowing, scrollToBottom]);

    // Handle scroll - track position for floating scroll indicator (immediate response)
    const handleScroll = useCallback(() => {
        const container = messageChainRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const isMovingUp = scrollTop < lastObservedScrollTopRef.current;
        const isMovingDown = scrollTop > lastObservedScrollTopRef.current;
        const isAtBottom = container.scrollHeight - scrollTop - container.clientHeight <= 1;

        // Layout changes and programmatic scrolling also emit scroll events. Only
        // consider an upward scrollbar drag user intent here; wheel, touch, and
        // keyboard intent are handled by their corresponding events below.
        if (isPointerDownRef.current && isMovingUp) {
            markUserScrolledUp();
        } else if (isAtBottom && isMovingDown && userHasScrolledUpRef.current) {
            resumeFollowing();
        }

        lastObservedScrollTopRef.current = scrollTop;
    }, [markUserScrolledUp, messageChainRef, resumeFollowing]);

    const previousGeneratingRef = useRef(isGenerating);
    const isInitialScrollPendingRef = useRef(true);
    const initialScrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialScrollRafRef = useRef<number | null>(null);
    const messageChainLengthRef = useRef(messageChain.length);
    const lastMessageId = messageChain.at(-1)?.id;

    messageChainLengthRef.current = messageChain.length;

    const clearInitialScrollIdleTimer = useCallback(() => {
        if (initialScrollIdleTimerRef.current) {
            clearTimeout(initialScrollIdleTimerRef.current);
            initialScrollIdleTimerRef.current = null;
        }
    }, []);

    const scheduleInitialScrollComplete = useCallback(() => {
        clearInitialScrollIdleTimer();
        initialScrollIdleTimerRef.current = setTimeout(() => {
            if (messageChainLengthRef.current === 0) {
                return;
            }
            isInitialScrollPendingRef.current = false;
        }, INITIAL_SCROLL_IDLE_MS);
    }, [clearInitialScrollIdleTimer]);

    const tryAutoScroll = useCallback(() => {
        if (userHasScrolledUpRef.current || messageChain.length === 0 || !messageChainRef.current) {
            return;
        }

        if (isInitialScrollPendingRef.current) {
            scrollToBottom(true);
            scheduleInitialScrollComplete();
            return;
        }

        if (isGeneratingRef.current) {
            messageChainRef.current.scrollTo({
                top: messageChainRef.current.scrollHeight,
                behavior: 'instant',
            });
        }
    }, [messageChain.length, messageChainRef, scheduleInitialScrollComplete, scrollToBottom]);

    const scheduleAutoScroll = useCallback(() => {
        if (initialScrollRafRef.current !== null) {
            return;
        }

        initialScrollRafRef.current = requestAnimationFrame(() => {
            initialScrollRafRef.current = null;
            tryAutoScroll();
        });
    }, [tryAutoScroll]);

    useEffect(() => {
        const wasGenerating = previousGeneratingRef.current;
        previousGeneratingRef.current = isGenerating;

        if (isGenerating && !wasGenerating) {
            isInitialScrollPendingRef.current = false;
            clearInitialScrollIdleTimer();
            resumeFollowing();
            scrollToBottom(true);
        }
    }, [clearInitialScrollIdleTimer, isGenerating, resumeFollowing, scrollToBottom]);

    useEffect(() => {
        const container = messageChainRef.current;
        if (!container) return;

        lastObservedScrollTopRef.current = container.scrollTop;
        container.addEventListener('scroll', handleScroll, { passive: true });

        const handleWheel = (event: WheelEvent) => {
            if (event.deltaY < 0) {
                markUserScrolledUp();
            }
        };

        let previousTouchY: number | null = null;

        const handleTouchStart = (event: TouchEvent) => {
            previousTouchY = event.touches[0]?.clientY ?? null;
        };

        const handleTouchMove = (event: TouchEvent) => {
            const currentTouchY = event.touches[0]?.clientY;

            if (currentTouchY !== undefined && previousTouchY !== null && currentTouchY > previousTouchY) {
                markUserScrolledUp();
            }

            previousTouchY = currentTouchY ?? null;
        };

        const handleTouchEnd = () => {
            previousTouchY = null;
        };

        const handlePointerDown = () => {
            isPointerDownRef.current = true;
            lastObservedScrollTopRef.current = container.scrollTop;
        };

        const handlePointerUp = () => {
            isPointerDownRef.current = false;
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home') {
                markUserScrolledUp();
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        container.addEventListener('pointerdown', handlePointerDown, { passive: true });
        container.addEventListener('keydown', handleKeyDown);
        window.addEventListener('pointerup', handlePointerUp, { passive: true });
        window.addEventListener('pointercancel', handlePointerUp, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
            container.removeEventListener('pointerdown', handlePointerDown);
            container.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [handleScroll, markUserScrolledUp, messageChainRef]);

    useEffect(() => {
        isInitialScrollPendingRef.current = true;
        clearInitialScrollIdleTimer();

        return () => {
            clearInitialScrollIdleTimer();
            if (initialScrollRafRef.current !== null) {
                cancelAnimationFrame(initialScrollRafRef.current);
                initialScrollRafRef.current = null;
            }
        };
    }, [clearInitialScrollIdleTimer, conversationId]);

    // Scroll before paint when the chain changes (new messages from remote / IDB).
    useLayoutEffect(() => {
        tryAutoScroll();
    }, [conversationId, lastMessageId, messageChain.length, tryAutoScroll]);

    // Full message bodies, markdown, and images load after the chain length stabilizes.
    useEffect(() => {
        const container = messageChainRef.current;
        if (!container) {
            return;
        }

        const observer = new MutationObserver(() => {
            scheduleAutoScroll();
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => observer.disconnect();
    }, [conversationId, messageChainRef, scheduleAutoScroll]);

    useEffect(() => {
        return () => {
            // Cancel any in-progress poll loop on unmount.
            scrollPollGenerationRef.current++;
        };
    }, []);

    return {
        userHasScrolledUp: scrollState.userHasScrolledUp,
        resumeAutoScroll,
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
    handleOpenFilePreview,
    onRetryPanelToggle,
    composerContainerRef,
    className,
    conversationId,
    afterMessages,
}: MessageChainComponentProps) => {
    const newMessageRef = useRef<HTMLDivElement | null>(null);

    const { userHasScrolledUp, resumeAutoScroll } = useAutoScroll(
        messageChainRef,
        messageChain,
        isGenerating,
        conversationId
    );
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
                className={`lumo-message-chain h-full overflow-y-auto px-6 md:px-0 flex-1 reset4print${className ? ` ${className}` : ''}`}
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
                                handleOpenFilePreview={handleOpenFilePreview}
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
                onClick={resumeAutoScroll}
                show={showScrollIndicator}
                composerContainerRef={composerContainerRef}
            />

            {afterMessages}
        </>
    );
};

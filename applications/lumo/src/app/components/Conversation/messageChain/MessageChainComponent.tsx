import React, { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage } from '../../../hooks/useLumoActions';
import type { SiblingInfo } from '../../../hooks/usePreferredSiblings';
import { type Attachment, type ConversationId, type Message, Role } from '../../../types';
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

    userHasScrolledUpRef.current = scrollState.userHasScrolledUp;

    const isNearBottom = useCallback(() => {
        if (!messageChainRef.current) return true;

        const container = messageChainRef.current;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        return distanceFromBottom <= 100;
    }, [messageChainRef]);

    // Incremented on each button click to cancel any in-progress poll loop.
    const scrollPollGenerationRef = useRef(0);
    const isProgrammaticScrollRef = useRef(false);
    const isGeneratingRef = useRef(isGenerating);

    isGeneratingRef.current = isGenerating;

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

    const scrollContainerToBottom = useCallback(
        (container: HTMLDivElement, behavior: ScrollBehavior) => {
            isProgrammaticScrollRef.current = true;
            container.scrollTo({
                top: container.scrollHeight,
                behavior,
            });
            requestAnimationFrame(() => {
                isProgrammaticScrollRef.current = false;
            });
        },
        []
    );

    const scrollToBottom = useCallback(
        (instant = false) => {
            const container = messageChainRef.current;
            if (!container) return;

            scrollContainerToBottom(container, instant ? 'instant' : 'smooth');

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
                scrollContainerToBottom(container, 'instant');

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
        [messageChainRef, scrollContainerToBottom]
    );

    const resumeAutoScroll = useCallback(() => {
        resumeFollowing();
        scrollToBottom(true);
    }, [resumeFollowing, scrollToBottom]);

    // Handle scroll - track position for floating scroll indicator (immediate response)
    const handleScroll = useCallback(() => {
        if (!messageChainRef.current || isProgrammaticScrollRef.current) return;

        const nearBottom = isNearBottom();

        // Simple state updates for scroll indicator
        if (!nearBottom && !scrollState.userHasScrolledUp) {
            markUserScrolledUp();
        } else if (nearBottom && scrollState.userHasScrolledUp) {
            resumeFollowing();
        }
    }, [isNearBottom, markUserScrolledUp, resumeFollowing, scrollState.userHasScrolledUp]);

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
            isProgrammaticScrollRef.current = true;
            container.scrollTo({
                top: questionElement.offsetTop,
                behavior: 'smooth',
            });
            requestAnimationFrame(() => {
                isProgrammaticScrollRef.current = false;
            });
        }
    };

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

    const tryAutoScrollOnContentChange = useCallback(() => {
        if (userHasScrolledUpRef.current || messageChain.length === 0 || !messageChainRef.current) {
            return;
        }

        const container = messageChainRef.current;

        if (isInitialScrollPendingRef.current) {
            scrollToBottom(true);
            scheduleInitialScrollComplete();
            return;
        }

        if (isGeneratingRef.current) {
            scrollContainerToBottom(container, 'instant');
        }
    }, [messageChain.length, messageChainRef, scheduleInitialScrollComplete, scrollContainerToBottom, scrollToBottom]);

    const scheduleAutoScrollOnContentChange = useCallback(() => {
        if (initialScrollRafRef.current !== null) {
            return;
        }

        initialScrollRafRef.current = requestAnimationFrame(() => {
            initialScrollRafRef.current = null;
            tryAutoScrollOnContentChange();
        });
    }, [tryAutoScrollOnContentChange]);

    useEffect(() => {
        const wasGenerating = previousGeneratingRef.current;
        previousGeneratingRef.current = isGenerating;

        if (isGenerating) {
            isInitialScrollPendingRef.current = false;
            clearInitialScrollIdleTimer();
        }

        // Only scroll when generation STARTS (not during streaming or when it ends)
        if (isGenerating && !wasGenerating) {
            resumeFollowing();
            setTimeout(() => {
                scrollQuestionToTopRef.current?.();
            }, 100);
        }
    }, [clearInitialScrollIdleTimer, isGenerating, resumeFollowing]);

    useEffect(() => {
        const container = messageChainRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });

        const handleWheel = (event: WheelEvent) => {
            if (event.deltaY < 0) {
                markUserScrolledUp();
            }
        };

        const handleTouchStart = () => {
            container.dataset.userTouchScrolling = 'true';
        };

        const handleTouchMove = () => {
            if (container.dataset.userTouchScrolling !== 'true') {
                return;
            }

            if (!isNearBottom()) {
                markUserScrolledUp();
            }
        };

        const handleTouchEnd = () => {
            delete container.dataset.userTouchScrolling;
        };

        container.addEventListener('wheel', handleWheel, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleScroll, isNearBottom, markUserScrolledUp, messageChainRef]);

    useEffect(() => {
        isInitialScrollPendingRef.current = !isGenerating;
        clearInitialScrollIdleTimer();

        return () => {
            clearInitialScrollIdleTimer();
            if (initialScrollRafRef.current !== null) {
                cancelAnimationFrame(initialScrollRafRef.current);
                initialScrollRafRef.current = null;
            }
        };
    }, [clearInitialScrollIdleTimer, conversationId, isGenerating]);

    // Scroll before paint when the chain changes (new messages from remote / IDB).
    useLayoutEffect(() => {
        tryAutoScrollOnContentChange();
    }, [conversationId, lastMessageId, messageChain.length, tryAutoScrollOnContentChange]);

    // Full message bodies, markdown, and images load after the chain length stabilizes.
    useEffect(() => {
        const container = messageChainRef.current;
        if (!container) {
            return;
        }

        const observer = new MutationObserver(() => {
            scheduleAutoScrollOnContentChange();
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => observer.disconnect();
    }, [conversationId, messageChainRef, scheduleAutoScrollOnContentChange]);

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

    useEffect(() => {
        return () => {
            messageChainRef.current = null;
        };
    }, [conversationId, messageChainRef]);

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

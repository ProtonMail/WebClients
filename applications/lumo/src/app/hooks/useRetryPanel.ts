import { useCallback, useState } from 'react';

import type { Message, RetryStrategy } from '../types';
import type { HandleRegenerateMessage } from './useLumoActions';

interface UseRetryPanelProps {
    messageChain: Message[];
    handleRegenerateMessage: HandleRegenerateMessage;
    isWebSearchButtonToggled: boolean;
}

interface RetryPanelState {
    messageId: string | null;
    show: boolean;
    buttonRef: HTMLElement | null;
}

export const useRetryPanel = ({
    messageChain,
    handleRegenerateMessage,
    isWebSearchButtonToggled,
}: UseRetryPanelProps) => {
    const [retryPanelState, setRetryPanelState] = useState<RetryPanelState>({
        messageId: null,
        show: false,
        buttonRef: null,
    });

    const handleRetryPanelToggle = useCallback((messageId: string, show: boolean, buttonRef?: HTMLElement) => {
        setRetryPanelState({ messageId, show, buttonRef: buttonRef || null });
    }, []);

    const handleRetryPanelClose = useCallback(() => {
        setRetryPanelState({ messageId: null, show: false, buttonRef: null });
    }, []);

    const handleRetry = useCallback(
        async (retryStrategy: RetryStrategy, customInstructions?: string) => {
            if (retryPanelState.messageId) {
                const message = messageChain.find((m) => m.id === retryPanelState.messageId);
                if (message) {
                    void handleRegenerateMessage(message, isWebSearchButtonToggled, retryStrategy, customInstructions);
                }
            }
            handleRetryPanelClose();
        },
        [
            retryPanelState.messageId,
            messageChain,
            handleRegenerateMessage,
            isWebSearchButtonToggled,
            handleRetryPanelClose,
        ]
    );

    return {
        retryPanelState,
        handleRetryPanelToggle,
        handleRetryPanelClose,
        handleRetry,
    };
};

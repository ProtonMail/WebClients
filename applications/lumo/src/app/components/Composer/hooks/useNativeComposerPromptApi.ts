import { useEffect, useRef } from 'react';

import type { HandleSendMessage } from '../../../hooks/useLumoActions';
import { onNativeAbortPrompt, onNativeSendPrompt } from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerPromptApi = (handleSendMessage: HandleSendMessage, handleAbort: () => void): void => {
    // Refs for native composer bridge event listeners
    // Using the useRef pattern here since we want to avoid registering native listeners on every function change
    const handleSendMessageRef = useRef<HandleSendMessage | null>(null);
    const handleAbortRef = useRef<(() => void) | null>(null);

    // Listen for native composer bridge events
    useEffect(() => {
        console.log('Setting up native composer bridge event listeners');

        // Handle send prompt from native bridge
        const unsubscribeSend = onNativeSendPrompt(async (event) => {
            const { text, webSearchEnabled } = event.detail;
            console.log('Received native send prompt event', handleSendMessageRef.current);

            if (text?.trim()) {
                await handleSendMessageRef.current?.(text, webSearchEnabled);
            }
        });

        // Handle abort prompt from native bridge
        const unsubscribeAbort = onNativeAbortPrompt(() => {
            console.log('Received native abort prompt event');
            handleAbortRef.current?.();
        });

        return () => {
            console.log('Cleaning up native composer bridge event listeners');
            unsubscribeSend();
            unsubscribeAbort();
        };
    }, []);

    useEffect(() => {
        handleSendMessageRef.current = handleSendMessage;
    }, [handleSendMessage]);

    useEffect(() => {
        handleAbortRef.current = handleAbort;
    }, [handleAbort]);
};

import { useCallback, useRef, useState } from 'react';

import type { Api } from '@proton/shared/lib/interfaces';

import { type AssistantCallOptions, LumoApiClient, type LumoApiClientConfig } from './index';
import { type Message, prepareTurns } from './utils';

/**
 * React hook for managing LLM conversations
 */
export function useLumoChat(api: Api, config?: LumoApiClientConfig) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef(new LumoApiClient(config));

    const sendMessage = useCallback(
        async (content: string, options: Partial<AssistantCallOptions> = {}) => {
            if (!content.trim()) return;

            const userMessage: Message = { role: 'user', content };
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setIsLoading(true);
            setError(null);

            let assistantResponse = '';

            try {
                await clientRef.current.callAssistant(api, prepareTurns(updatedMessages), {
                    ...options,
                    chunkCallback: async (message) => {
                        // fixme if we request a title (requestTitle), it will be ignored here (target === 'title')
                        if (message.type === 'token_data' && message.target === 'message') {
                            assistantResponse += message.content;

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                const lastIndex = newMessages.length - 1;

                                if (newMessages[lastIndex]?.role === 'assistant') {
                                    newMessages[lastIndex].content = assistantResponse;
                                } else {
                                    newMessages.push({ role: 'assistant', content: assistantResponse });
                                }

                                return newMessages;
                            });
                        } else if (message.type === 'error') {
                            return { error: new Error('Generation failed') };
                        }

                        return {};
                    },
                    finishCallback: async (status) => {
                        setIsLoading(false);
                        if (status === 'failed') {
                            setError('Failed to generate response');
                        }
                    },
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                setIsLoading(false);
            }
        },
        [api, messages]
    );

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    const regenerateLastMessage = useCallback(
        async (options: Partial<AssistantCallOptions> = {}) => {
            if (messages.length === 0) return;

            // Remove the last assistant message if present and regenerate
            const lastMessage = messages[messages.length - 1];
            const messagesToRegenerate = lastMessage.role === 'assistant' ? messages.slice(0, -1) : messages;

            setIsLoading(true);
            setError(null);

            let assistantResponse = '';

            try {
                await clientRef.current.callAssistant(api, prepareTurns(messagesToRegenerate), {
                    ...options,
                    chunkCallback: async (message) => {
                        if (message.type === 'token_data' && message.target === 'message') {
                            assistantResponse += message.content;

                            setMessages((prev) => {
                                const newMessages = messagesToRegenerate.slice();
                                newMessages.push({ role: 'assistant', content: assistantResponse });
                                return newMessages;
                            });
                        }
                        return {};
                    },
                    finishCallback: async (status) => {
                        setIsLoading(false);
                        if (status === 'failed') {
                            setError('Failed to regenerate response');
                        }
                    },
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                setIsLoading(false);
            }
        },
        [api, messages]
    );

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        regenerateLastMessage,
        setMessages,
    };
}

/**
 * Simple hook for one-off quick chats
 */
export function useQuickChat(api: Api, config?: LumoApiClientConfig) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef(new LumoApiClient(config));

    const chat = useCallback(
        async (
            message: string,
            options: {
                enableWebSearch?: boolean;
                onChunk?: (content: string) => void;
                signal?: AbortSignal;
            } = {}
        ): Promise<string> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await clientRef.current.quickChat(api, message, options);
                setIsLoading(false);
                return response;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(errorMessage);
                setIsLoading(false);
                throw err;
            }
        },
        [api]
    );

    return {
        chat,
        isLoading,
        error,
    };
}

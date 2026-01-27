import { useCallback, useRef, useState } from 'react';

import type { Api } from '@proton/shared/lib/interfaces';

import { LumoApiClient } from '../core/client';
import { type AssistantCallOptions, type LumoApiClientConfig, Role } from '../core/types';
import { type Message, prepareTurns } from '../utils';

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

            const userMessage: Message = { role: Role.User, content };
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setIsLoading(true);
            setError(null);

            let assistantResponse = '';

            try {
                await clientRef.current.callAssistant(api, prepareTurns(updatedMessages), {
                    ...options,
                    chunkCallback: async (message) => {
                        if (message.type === 'token_data' && message.target === 'message') {
                            assistantResponse += message.content;

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                const lastIndex = newMessages.length - 1;

                                if (newMessages[lastIndex]?.role === 'assistant') {
                                    newMessages[lastIndex].content = assistantResponse;
                                } else {
                                    newMessages.push({ role: Role.Assistant, content: assistantResponse });
                                }

                                return newMessages;
                            });
                        } else if (message.type === 'error') {
                            throw new Error('Generation failed');
                        }
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
                                newMessages.push({ role: Role.Assistant, content: assistantResponse });
                                return newMessages;
                            });
                        }
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

/**
 * Hook for using the fluent request builder API
 */
export function useRequestBuilder(api: Api, config?: LumoApiClientConfig) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef(new LumoApiClient(config));

    const execute = useCallback(async (builderFn: (client: LumoApiClient) => Promise<void>) => {
        setIsLoading(true);
        setError(null);

        try {
            await builderFn(clientRef.current);
            setIsLoading(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    }, []);

    const quickExecute = useCallback(async (builderFn: (client: LumoApiClient) => Promise<string>): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await builderFn(clientRef.current);
            setIsLoading(false);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    }, []);

    return {
        execute,
        quickExecute,
        isLoading,
        error,
        client: clientRef.current,
    };
}

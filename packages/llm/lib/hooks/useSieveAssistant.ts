import { useRef, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';
import useStateRef from '@proton/hooks/useStateRef';
import { LumoApiClient, Role } from '@proton/lumo-api-client';
import type { Turn } from '@proton/lumo-api-client/core/types';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { SIEVE_HELPER_SYSTEM_PROMPT, buildSieveUserTurn } from '../sieve/sieveHelperPrompt';

export interface SieveChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface SieveDraftContext {
    name: string;
    sieve: string;
}

/** Reused across sends; config mirrors the Scribe server assistant integration. */
const sieveLumoClient = new LumoApiClient({
    enableSmoothing: true,
    enableU2LEncryption: true,
});

/**
 * Builds the turns sent to Lumo: the Sieve primer as a system turn, the full chat history, and
 * the latest user turn with the current draft script attached as context.
 */
const buildTurns = (messages: SieveChatMessage[], context: SieveDraftContext): Turn[] => {
    const turns: Turn[] = [{ role: Role.System, content: SIEVE_HELPER_SYSTEM_PROMPT }];

    messages.forEach((message, index) => {
        const isLatestUserMessage = index === messages.length - 1 && message.role === 'user';
        const content = isLatestUserMessage
            ? buildSieveUserTurn({ name: context.name, sieve: context.sieve, message: message.content })
            : message.content;
        turns.push({ role: message.role === 'user' ? Role.User : Role.Assistant, content });
    });

    return turns;
};

/**
 * A thin multi-turn chat hook over `LumoApiClient.callAssistant` for the Sieve filter helper.
 * Holds the message list, streams assistant tokens into the in-flight message, and exposes
 * `stop()` (via AbortController), an `error` state and `retry()`.
 */
export const useSieveAssistant = () => {
    const api = useApi();
    const [messages, setMessages, messagesRef] = useStateRef<SieveChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(false);
    const controllerRef = useRef<AbortController | null>(null);
    const lastContextRef = useRef<SieveDraftContext | null>(null);

    const setAssistantContent = (content: string) => {
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.role !== 'assistant') {
                return prev;
            }
            const next = [...prev];
            next[next.length - 1] = { ...last, content };
            return next;
        });
    };

    const removeTrailingEmptyAssistant = () => {
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && last.content === '') {
                return prev.slice(0, -1);
            }
            return prev;
        });
    };

    const generate = async (history: SieveChatMessage[], context: SieveDraftContext) => {
        const turns = buildTurns(history, context);
        setMessages([...history, { role: 'assistant', content: '' }]);

        const controller = new AbortController();
        controllerRef.current = controller;
        setIsGenerating(true);

        let fullContent = '';
        try {
            await sieveLumoClient.callAssistant(api, turns, {
                signal: controller.signal,
                enableReasoning: false,
                chunkCallback: (msg) => {
                    if (msg.type === 'token_data' && msg.target === 'message') {
                        fullContent += msg.content;
                        setAssistantContent(fullContent);
                    }
                },
                finishCallback: (status) => {
                    if (status === 'failed') {
                        setError(true);
                    }
                },
            });
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setError(true);
                traceInitiativeError(SentryMailInitiatives.LUMO_IN_MAIL, e);
            }
        } finally {
            controllerRef.current = null;
            setIsGenerating(false);
            removeTrailingEmptyAssistant();
        }
    };

    const send = (message: string, context: SieveDraftContext) => {
        const trimmed = message.trim();
        if (!trimmed || isGenerating) {
            return;
        }
        setError(false);
        lastContextRef.current = context;
        const history: SieveChatMessage[] = [...messagesRef.current, { role: 'user', content: trimmed }];
        void generate(history, context);
    };

    const retry = () => {
        if (isGenerating || !lastContextRef.current) {
            return;
        }
        setError(false);
        // After a failure the trailing empty assistant bubble was dropped, so the history already
        // ends with the user message we want to resend.
        void generate([...messagesRef.current], lastContextRef.current);
    };

    const stop = () => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        setIsGenerating(false);
        removeTrailingEmptyAssistant();
    };

    return { messages, isGenerating, error, send, retry, stop };
};

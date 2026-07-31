import { useCallback, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import type { ConfirmDecision, ToolChip } from '@proton/llm/lib/lumoAgent/engine/engine';
import { createClientToolExecutor } from '@proton/llm/lib/lumoAgent/engine/engine';
import { LOAD_GUIDE_TOOL_NAME } from '@proton/llm/lib/lumoAgent/engine/loadGuide';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { buildSystemPrompt } from '@proton/llm/lib/lumoAgent/prompt/buildSystemPrompt';
import type {
    ChatCompletionsFunctionTool,
    GenerationResponseMessage,
    LumoApiClient,
    Role,
    ToolName as ServerToolName,
    Turn,
} from '@proton/lumo-api-client';
import type { ServerToolSource } from '@proton/lumo-ui';

import type { LumoAgentConfig, LumoAgentItem } from './types';

const SYSTEM = 'system' as Role;
const USER = 'user' as Role;
const ASSISTANT = 'assistant' as Role;

/**
 * Lazily instantiate the Lumo client on first send so `@proton/lumo-api-client` stays out of the
 * shared `@proton/components` bundle until the assistant is actually used (bundle hygiene, plan §6).
 */
let clientPromise: Promise<LumoApiClient> | null = null;
const getLumoClient = (): Promise<LumoApiClient> => {
    if (!clientPromise) {
        clientPromise = import('@proton/lumo-api-client').then(
            ({ LumoApiClient }) => new LumoApiClient({ enableSmoothing: true, enableU2LEncryption: true })
        );
    }
    return clientPromise;
};

/** Parse a `web_search`/`proton_info` result payload into the sources the chip renders; tolerant of noise. */
const extractWebSources = (content: string): ServerToolSource[] => {
    try {
        const parsed = JSON.parse(content);
        const results = parsed?.results;
        if (!Array.isArray(results)) {
            return [];
        }
        return results
            .filter((entry: any) => entry?.url)
            .map((entry: any) => ({ url: String(entry.url), title: String(entry.title ?? entry.url) }));
    } catch {
        return [];
    }
};

/**
 * The generic controller hook for a Lumo agent. It owns the chat transcript, drives the transport's
 * tool loop once per message via `callAssistant` + the MR4 {@link createClientToolExecutor}, and maps
 * the streamed chunks + the executor's chips/confirmations into {@link LumoAgentItem}s. It holds no
 * product knowledge — `config` supplies the tools, handlers, rules, and card renderers.
 *
 * `config` MUST be referentially stable (memoise it in the caller): the executor, reference registry,
 * and loaded-guide set are built once per session from it and re-created only on `clear()`.
 */
const useLumoAgent = (config: LumoAgentConfig) => {
    const api = useApi();

    const [items, setItems] = useState<LumoAgentItem[]>([]);
    const [isBusy, setIsBusy] = useState(false);
    const [sessionKey, setSessionKey] = useState(0);

    const idRef = useRef(0);
    const controllerRef = useRef<AbortController | null>(null);
    const confirmResolveRef = useRef<((decision: ConfirmDecision) => void) | null>(null);
    const historyRef = useRef<Turn[]>([]);
    // The id of the reply item currently being streamed, and its accumulated text. `null` means the
    // next prose delta starts a fresh reply bubble (used to split lead-ins from the final answer).
    const replyIdRef = useRef<number | null>(null);
    const replyTextRef = useRef('');

    const nextId = useCallback(() => (idRef.current += 1), []);
    const pushItem = useCallback((item: LumoAgentItem) => setItems((prev) => [...prev, item]), []);
    const finalizeReply = useCallback(() => {
        replyIdRef.current = null;
    }, []);
    const pushError = useCallback(() => {
        finalizeReply();
        pushItem({ id: nextId(), kind: 'error', message: c('Error').t`Something went wrong. Please try again.` });
    }, [finalizeReply, nextId, pushItem]);

    const appendReplyDelta = useCallback(
        (delta: string) => {
            if (replyIdRef.current === null) {
                const id = nextId();
                replyIdRef.current = id;
                replyTextRef.current = delta;
                pushItem({ id, kind: 'reply', text: delta });
                return;
            }
            replyTextRef.current += delta;
            const id = replyIdRef.current;
            const text = replyTextRef.current;
            setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
        },
        [nextId, pushItem]
    );

    const settleLastPendingConfirm = useCallback((status: 'applied' | 'cancelled') => {
        setItems((prev) => {
            const index = [...prev].reverse().findIndex((item) => item.kind === 'confirm' && item.status === 'pending');
            if (index === -1) {
                return prev;
            }
            const realIndex = prev.length - 1 - index;
            return prev.map((item, i) => (i === realIndex && item.kind === 'confirm' ? { ...item, status } : item));
        });
    }, []);

    // Built once per session (per `sessionKey`); holds the reference registry + loaded-guide set so
    // they persist across messages. Confirmations resolve the executor's `ConfirmController` promise.
    const executor = useMemo(() => {
        const references = createReferenceRegistry();
        const byName = new Map(config.definitions.map((definition) => [definition.name, definition]));
        return createClientToolExecutor({
            definitions: config.definitions,
            handlers: config.handlers,
            references,
            confirm: {
                requestConfirmation: (action, labels) =>
                    new Promise<ConfirmDecision>((resolve) => {
                        finalizeReply();
                        pushItem({ id: nextId(), kind: 'confirm', action, labels, status: 'pending' });
                        confirmResolveRef.current = resolve;
                    }),
            },
            onChip: (chip: ToolChip) => {
                finalizeReply();
                // Mutations are shown by their confirm/result tile, not a chip; a guide load is internal
                // setup the user gains nothing from seeing. Both still split the reply bubble.
                if (byName.get(chip.tool)?.kind === 'mutation' || chip.tool === LOAD_GUIDE_TOOL_NAME) {
                    return;
                }
                pushItem({
                    id: nextId(),
                    kind: 'chip',
                    tool: chip.tool,
                    label: chip.summary.label,
                    payload: chip.payload,
                });
            },
        });
    }, [config, sessionKey, nextId, pushItem, finalizeReply]);

    const send = useCallback(
        async (message: string) => {
            const text = message.trim();
            if (!text || isBusy || controllerRef.current) {
                return;
            }

            finalizeReply();
            pushItem({ id: nextId(), kind: 'user', text });
            setIsBusy(true);

            const controller = new AbortController();
            controllerRef.current = controller;

            // Guides loaded in earlier messages must ride in the prompt: mid-loop, a guide only reaches
            // the model as tool content, which is not replayed into history.
            const systemTurn: Turn = {
                role: SYSTEM,
                content: buildSystemPrompt({
                    definitions: config.definitions,
                    loadedGuides: executor.getLoadedGuides(),
                    productRules: config.productRules,
                }),
            };
            const turns: Turn[] = [systemTurn, ...historyRef.current, { role: USER, content: text }];

            const serverSources = new Map<string, number>();

            const chunkCallback = (chunk: GenerationResponseMessage) => {
                if (chunk.type === 'token_data' && chunk.target === 'message') {
                    appendReplyDelta(chunk.content);
                } else if (chunk.type === 'server_tool_call') {
                    // Client tool calls ride this channel too; those are shown by the executor's chips.
                    if (!config.serverTools?.includes(chunk.name as ServerToolName)) {
                        return;
                    }
                    if (!serverSources.has(chunk.call_id)) {
                        finalizeReply();
                        const id = nextId();
                        serverSources.set(chunk.call_id, id);
                        pushItem({ id, kind: 'servertool', tool: chunk.name as ServerToolName, sources: [] });
                    }
                } else if (chunk.type === 'server_tool_result') {
                    const id = serverSources.get(chunk.call_id);
                    const sources = extractWebSources(chunk.content);
                    if (id !== undefined && sources.length) {
                        setItems((prev) =>
                            prev.map((item) =>
                                item.id === id && item.kind === 'servertool' ? { ...item, sources } : item
                            )
                        );
                    }
                } else if (
                    chunk.type === 'error' ||
                    chunk.type === 'rejected' ||
                    chunk.type === 'harmful' ||
                    chunk.type === 'timeout'
                ) {
                    pushError();
                }
            };

            try {
                const client = await getLumoClient();
                const clientTools: ChatCompletionsFunctionTool[] = (await executor.getClientTools?.()) ?? [];
                await client.callAssistant(api, turns, {
                    clientToolExecutor: executor,
                    clientTools,
                    serverTools: config.serverTools,
                    signal: controller.signal,
                    chunkCallback,
                });
                historyRef.current = [
                    ...historyRef.current,
                    { role: USER, content: text },
                    { role: ASSISTANT, content: replyTextRef.current },
                ];
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    pushError();
                }
            } finally {
                controllerRef.current = null;
                setIsBusy(false);
            }
        },
        [api, config, executor, isBusy, appendReplyDelta, finalizeReply, nextId, pushItem, pushError]
    );

    const confirm = useCallback(
        (params: Record<string, any>) => {
            const resolve = confirmResolveRef.current;
            if (!resolve) {
                return;
            }
            confirmResolveRef.current = null;
            settleLastPendingConfirm('applied');
            resolve({ action: 'apply', params });
        },
        [settleLastPendingConfirm]
    );

    const cancel = useCallback(() => {
        const resolve = confirmResolveRef.current;
        if (!resolve) {
            return;
        }
        confirmResolveRef.current = null;
        settleLastPendingConfirm('cancelled');
        resolve({ action: 'cancel' });
    }, [settleLastPendingConfirm]);

    const stop = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        setIsBusy(false);
    }, []);

    const clear = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        confirmResolveRef.current = null;
        historyRef.current = [];
        replyIdRef.current = null;
        replyTextRef.current = '';
        setItems([]);
        setIsBusy(false);
        setSessionKey((key) => key + 1);
    }, []);

    return { items, isBusy, hasConversation: items.length > 0, send, confirm, cancel, stop, clear };
};

export default useLumoAgent;

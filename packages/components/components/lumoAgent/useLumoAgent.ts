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
 * tool loop once per message via `callAssistant` + {@link createClientToolExecutor}, and maps
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
    const [isAtToolLimit, setIsAtToolLimit] = useState(false);

    const idRef = useRef(0);
    const controllerRef = useRef<AbortController | null>(null);
    const confirmResolveRef = useRef<((decision: ConfirmDecision) => void) | null>(null);
    const historyRef = useRef<Turn[]>([]);
    const pendingResumeRef = useRef<{ turns: Turn[]; userText: string; reply: string } | null>(null);
    const replyIdRef = useRef<number | null>(null);
    const replyTextRef = useRef('');
    // Every bubble of prose the current chain has written, carried across a resume so history keeps the
    // half of the answer the user already read. `replyTextRef` only ever holds the live bubble.
    const chainReplyRef = useRef('');

    const nextId = useCallback(() => (idRef.current += 1), []);
    const pushItem = useCallback((item: LumoAgentItem) => setItems((prev) => [...prev, item]), []);
    const finalizeReply = useCallback(() => {
        replyIdRef.current = null;
    }, []);
    const pushError = useCallback(() => {
        finalizeReply();
        pushItem({ id: nextId(), kind: 'error', message: c('Error').t`Something went wrong. Please try again.` });
    }, [finalizeReply, nextId, pushItem]);

    const commitHistory = useCallback((userText: string, reply: string) => {
        // A chain that ended without prose has nothing worth remembering, and an empty assistant turn is
        // a shape the transport strips anyway — bank neither side rather than an unanswered question.
        if (!reply) {
            return;
        }
        historyRef.current = [
            ...historyRef.current,
            { role: USER, content: userText },
            { role: ASSISTANT, content: reply },
        ];
    }, []);

    const clearPendingResume = useCallback(() => {
        pendingResumeRef.current = null;
        setIsAtToolLimit(false);
    }, []);

    const discardPendingResume = useCallback(() => {
        const pending = pendingResumeRef.current;
        if (!pending) {
            return;
        }
        clearPendingResume();
        commitHistory(pending.userText, pending.reply);
    }, [clearPendingResume, commitHistory]);

    const appendReplyDelta = useCallback(
        (delta: string) => {
            if (replyIdRef.current === null) {
                const id = nextId();
                replyIdRef.current = id;
                replyTextRef.current = delta;
                chainReplyRef.current = chainReplyRef.current ? `${chainReplyRef.current}\n\n${delta}` : delta;
                pushItem({ id, kind: 'reply', text: delta });
                return;
            }
            replyTextRef.current += delta;
            chainReplyRef.current += delta;
            const id = replyIdRef.current;
            const text = replyTextRef.current;
            setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
        },
        [nextId, pushItem]
    );

    /** `appliedParams` replace the proposed ones, so the settled tile reports what ran, not what was offered. */
    const settleLastPendingConfirm = useCallback(
        (status: 'applied' | 'cancelled', appliedParams?: Record<string, any>) => {
            setItems((prev) => {
                const index = [...prev]
                    .reverse()
                    .findIndex((item) => item.kind === 'confirm' && item.status === 'pending');
                if (index === -1) {
                    return prev;
                }
                const realIndex = prev.length - 1 - index;
                return prev.map((item, i) =>
                    i === realIndex && item.kind === 'confirm'
                        ? {
                              ...item,
                              status,
                              action: appliedParams ? { ...appliedParams, type: item.action.type } : item.action,
                          }
                        : item
                );
            });
        },
        []
    );

    const confirm = useCallback(
        (params: Record<string, any>) => {
            const resolve = confirmResolveRef.current;
            if (!resolve) {
                return;
            }
            confirmResolveRef.current = null;
            settleLastPendingConfirm('applied', params);
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
        cancel();
        setIsBusy(false);
    }, [cancel]);

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

    const runChain = useCallback(
        async (turns: Turn[], userText: string, carriedReply = '') => {
            setIsBusy(true);
            chainReplyRef.current = carriedReply;

            const controller = new AbortController();
            controllerRef.current = controller;

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
                // The executor is shared across chains, so bind this one's signal to its batches: an
                // abandoned chain must not confirm and run the tail of its batch on the turn that replaced it.
                const { stoppedOnBudget, turns: chainTurns } = await client.callAssistant(api, turns, {
                    clientToolExecutor: {
                        ...executor,
                        execute: (calls) => executor.execute(calls, { signal: controller.signal }),
                    },
                    clientTools,
                    serverTools: config.serverTools,
                    signal: controller.signal,
                    chunkCallback,
                });
                if (stoppedOnBudget) {
                    finalizeReply();
                    if (!chainReplyRef.current) {
                        // The budget can run out on a tool-only round, leaving the user nothing to read
                        // and nothing to bank if they decline. Say so instead of stopping in silence.
                        appendReplyDelta(c('Info').t`I have not finished this one yet.`);
                        finalizeReply();
                    }
                    pendingResumeRef.current = { turns: chainTurns, userText, reply: chainReplyRef.current };
                    setIsAtToolLimit(true);
                    return;
                }
                clearPendingResume();
                commitHistory(userText, chainReplyRef.current);
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    pushError();
                }
                // The stash outlives a failed resume, so the offer to carry on comes back rather than
                // taking the whole exchange down with it.
                setIsAtToolLimit(pendingResumeRef.current !== null);
            } finally {
                // An abandoned chain must not clear state its successor already owns.
                if (controllerRef.current === controller) {
                    controllerRef.current = null;
                    setIsBusy(false);
                }
            }
        },
        [
            api,
            config,
            executor,
            appendReplyDelta,
            clearPendingResume,
            commitHistory,
            finalizeReply,
            nextId,
            pushItem,
            pushError,
        ]
    );

    const send = useCallback(
        async (message: string) => {
            const text = message.trim();
            if (!text) {
                return;
            }
            // Typing instead of answering the card rejects it; its chain is parked inside `execute()` and
            // cannot take another message, so it is abandoned.
            if (confirmResolveRef.current) {
                stop();
            } else if (isBusy || controllerRef.current) {
                return;
            }

            discardPendingResume();
            finalizeReply();
            pushItem({ id: nextId(), kind: 'user', text });

            const systemTurn: Turn = {
                role: SYSTEM,
                content: buildSystemPrompt({
                    definitions: config.definitions,
                    loadedGuides: executor.getLoadedGuides(),
                    productRules: config.productRules,
                }),
            };

            await runChain([systemTurn, ...historyRef.current, { role: USER, content: text }], text);
        },
        [config, executor, isBusy, discardPendingResume, finalizeReply, nextId, pushItem, runChain, stop]
    );

    const resume = useCallback(async () => {
        const pending = pendingResumeRef.current;
        if (!pending || isBusy || controllerRef.current) {
            return;
        }
        // The stash stays put until `runChain` has banked the exchange: if the resume aborts or throws,
        // the partial answer and the offer to carry on are both still there.
        setIsAtToolLimit(false);
        finalizeReply();

        await runChain(pending.turns, pending.userText, pending.reply);
    }, [isBusy, finalizeReply, runChain]);

    const clear = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        confirmResolveRef.current = null;
        historyRef.current = [];
        replyIdRef.current = null;
        replyTextRef.current = '';
        chainReplyRef.current = '';
        clearPendingResume();
        setItems([]);
        setIsBusy(false);
        setSessionKey((key) => key + 1);
    }, [clearPendingResume]);

    return {
        items,
        isBusy,
        isAtToolLimit,
        hasConversation: items.length > 0,
        send,
        resume,
        dismissToolLimit: discardPendingResume,
        confirm,
        cancel,
        stop,
        clear,
    };
};

export default useLumoAgent;

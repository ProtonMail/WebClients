import { useCallback, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import type { ToolDefinition } from '@proton/llm/lib/lumoAgent/contracts/types';
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
const TOOL_CALL = 'tool_call' as Role;
const TOOL_RESULT = 'tool_result' as Role;

/** Stands in for an elided read payload; the values it held are stale by the time it would be replayed. */
const ELIDED_READ = '[earlier read - re-run the tool for current values]';

const parseToolCallName = (content: string | undefined): string => {
    try {
        return String(JSON.parse(content || '{}')?.name ?? '');
    } catch {
        return '';
    }
};

/**
 * The chain as history should remember it: the narration and every tool call verbatim, so the model can
 * see that it works by calling tools, but a read's payload replaced by {@link ELIDED_READ} so a replay
 * never answers from values that have since moved on. A mutation's result is the durable fact the next
 * turn reasons from ("was off"), so it stays. A call naming a tool this session does not define is read
 * as a read — eliding is the safe side.
 */
const projectChainForHistory = (chainWork: Turn[], definitions: ToolDefinition[]): Turn[] => {
    const kindByName = new Map(definitions.map((definition) => [definition.name, definition.kind]));
    const projected: Turn[] = [];
    let calledName = '';

    for (const turn of chainWork) {
        if (turn.role === ASSISTANT) {
            if (turn.content) {
                projected.push(turn);
            }
            continue;
        }
        if (turn.role === TOOL_CALL) {
            calledName = parseToolCallName(turn.content);
            projected.push(turn);
            continue;
        }
        if (turn.role === TOOL_RESULT) {
            const isMutation = kindByName.get(calledName) === 'mutation';
            projected.push(isMutation ? turn : { role: TOOL_RESULT, content: ELIDED_READ });
            continue;
        }
        projected.push(turn);
    }

    return projected;
};

/**
 * The transport pads a tool round with a blank assistant turn and drops that padding again before the
 * next one, so a resumed chain comes back one turn shorter at the front than it was sent. Measuring both
 * ends without the padding keeps them aligned, and keeps a blank turn from reading as narration.
 */
const withoutBlankAssistantTurns = (turns: Turn[]): Turn[] =>
    turns.filter((turn) => turn.role !== ASSISTANT || !!turn.content?.trim());

/** Banked history replays as question-then-answer, so a trailing tool call or result is not banked. */
const untilLastSpokenTurn = (turns: Turn[]): Turn[] => {
    const fromEnd = [...turns].reverse().findIndex((turn) => turn.role === ASSISTANT && !!turn.content);
    return fromEnd === -1 ? [] : turns.slice(0, turns.length - fromEnd);
};

/**
 * Prose the projection does not already carry, merged into a trailing assistant turn rather than added
 * beside it: a resumed exchange writes its answer in two halves, and the history it replays is one turn.
 */
const appendProse = (turns: Turn[], prose: string): Turn[] => {
    const last = turns[turns.length - 1];
    if (last?.role === ASSISTANT && last.content) {
        return [...turns.slice(0, -1), { role: ASSISTANT, content: `${last.content}\n\n${prose}` }];
    }
    return [...turns, { role: ASSISTANT, content: prose }];
};

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
    // What the debug transcript copies: every turn verbatim, including read payloads history elides.
    const transcriptRef = useRef<Turn[]>([]);
    // The exchange's projected turns, waiting to be banked. Per exchange, not per chain: a chain that
    // stops on the round budget banks nothing, and the resumed chain only sees its own new turns.
    const projectedChainRef = useRef<Turn[]>([]);
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

    /** Banks the exchange the projection has accumulated, and empties it either way. */
    const commitHistory = useCallback((userText: string) => {
        const projected = untilLastSpokenTurn(projectedChainRef.current);
        projectedChainRef.current = [];
        // An exchange that ended without prose has nothing worth remembering — bank neither side rather
        // than an unanswered question.
        if (!projected.length) {
            return;
        }
        historyRef.current = [...historyRef.current, { role: USER, content: userText }, ...projected];
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
        commitHistory(pending.userText);
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

    /**
     * Bank a finished chain's own turns — each round's narration, then its tool calls (id, name,
     * decrypted arguments) and results — in the order the model produced them. The transport breaks its
     * loop before banking the closing prose, so what this chain produced minus the narration already in
     * `chainWork` supplies it: nothing when the last round called a tool rather than speaking. A resumed
     * chain carries the prose the user already read, and the chain that wrote it banked it, so that
     * prefix is dropped first. The live bubble is the fallback for a chain whose prose a chip or an
     * error split mid-round, where the subtraction no longer lines up. The same walk projects the chain
     * into the exchange history is waiting to bank (see {@link projectChainForHistory}).
     */
    const recordChainWork = useCallback(
        (chainWork: Turn[], carriedReply: string) => {
            // A resumed chain's first bubble is joined onto the prose it carries; the subtraction only
            // lines up once that join is off the front.
            const produced = chainReplyRef.current.slice(carriedReply.length).trimStart();
            const narrated = chainWork
                .filter((turn) => turn.role === ASSISTANT)
                .map((turn) => turn.content)
                .join('\n\n');
            const closing = produced.startsWith(narrated)
                ? produced.slice(narrated.length).trimStart()
                : replyTextRef.current;
            transcriptRef.current.push(...chainWork);
            projectedChainRef.current.push(...projectChainForHistory(chainWork, config.definitions));
            if (closing) {
                transcriptRef.current.push({ role: ASSISTANT, content: closing });
                projectedChainRef.current = appendProse(projectedChainRef.current, closing);
            }
        },
        [config]
    );

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
                // An abandoned chain can return normally rather than throw — the transport reports an
                // aborted budget stop as a plain finish — so nothing past this point may land on the turn
                // that replaced it.
                if (controllerRef.current !== controller) {
                    return;
                }
                const sentCount = withoutBlankAssistantTurns(turns).length;
                recordChainWork(withoutBlankAssistantTurns(chainTurns).slice(sentCount), carriedReply);
                if (stoppedOnBudget) {
                    finalizeReply();
                    if (!chainReplyRef.current) {
                        // The budget can run out on a tool-only round, leaving the user nothing to read
                        // and nothing to bank if they decline. Say so instead of stopping in silence.
                        const unfinished = c('Info').t`I have not finished this one yet.`;
                        appendReplyDelta(unfinished);
                        finalizeReply();
                        // `recordChainWork` has already run, so this one has to be projected by hand.
                        projectedChainRef.current = appendProse(projectedChainRef.current, unfinished);
                    }
                    pendingResumeRef.current = { turns: chainTurns, userText, reply: chainReplyRef.current };
                    setIsAtToolLimit(true);
                    return;
                }
                clearPendingResume();
                commitHistory(userText);
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    pushError();
                }
                // Known gap: a failed chain's turns stay inside the transport, so the tool exchanges of
                // the run most worth reporting never reach the transcript.
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
            recordChainWork,
            finalizeReply,
            nextId,
            pushItem,
            pushError,
        ]
    );

    const buildSystemTurn = useCallback(
        (): Turn => ({
            role: SYSTEM,
            content: buildSystemPrompt({
                definitions: config.definitions,
                loadedGuides: executor.getLoadedGuides(),
                productRules: config.productRules,
            }),
        }),
        [config, executor]
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
            // Anything the last exchange left unbanked (an abandoned or failed chain) is not this one's.
            projectedChainRef.current = [];
            finalizeReply();
            pushItem({ id: nextId(), kind: 'user', text });
            transcriptRef.current.push({ role: USER, content: text });

            await runChain([buildSystemTurn(), ...historyRef.current, { role: USER, content: text }], text);
        },
        [buildSystemTurn, isBusy, discardPendingResume, finalizeReply, nextId, pushItem, runChain, stop]
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

    /**
     * The model-facing exchange as one copyable string, for a bug report: the system prompt, then each
     * question, the tool calls and results it drove, and the answer. The diagnostic events the POC
     * interleaved need an event log this hook does not keep, and stay out of scope.
     */
    const getDebugTranscript = useCallback(
        () =>
            [buildSystemTurn(), ...transcriptRef.current]
                .map((turn) => `===== ${turn.role.toUpperCase()} =====\n${turn.content ?? ''}`)
                .join('\n\n'),
        [buildSystemTurn]
    );

    const clear = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        confirmResolveRef.current = null;
        historyRef.current = [];
        transcriptRef.current = [];
        projectedChainRef.current = [];
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
        getDebugTranscript,
    };
};

export default useLumoAgent;

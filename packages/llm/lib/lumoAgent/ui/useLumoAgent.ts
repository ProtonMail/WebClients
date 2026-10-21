import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import type { LumoApiClient } from '@proton/lumo-api-client/core/client';
import type {
    ChatCompletionsFunctionTool,
    GenerationResponseMessage,
    Role,
    ToolName as ServerToolName,
    Turn,
} from '@proton/lumo-api-client/core/types';
import type { WireImage } from '@proton/lumo-api-client/types-api';
import { lumoImageMarker } from '@proton/lumo-api-client/utils';
import type { ServerToolSource } from '@proton/lumo-ui/ServerToolChip';

import type { ToolImage, ToolName } from '../contracts/types';
import type { ConfirmDecision, ToolChip } from '../engine/engine';
import { ConfirmOutcome, createClientToolExecutor } from '../engine/engine';
import { LOAD_GUIDE_TOOL_NAME } from '../engine/loadGuide';
import { createReferenceRegistry } from '../engine/referenceRegistry';
import { buildSystemPrompt } from '../prompt/buildSystemPrompt';
import type { LumoAgentConfig, LumoAgentItem } from './types';
import { ConfirmStatus, LumoChainEnd, LumoConfirmAnswer } from './types';

/** The engine reports how a change went; the tile is a UI state. Neither vocabulary owns the other. */
const OUTCOME_STATUS: Record<ConfirmOutcome, ConfirmStatus> = {
    [ConfirmOutcome.APPLIED]: ConfirmStatus.APPLIED,
    [ConfirmOutcome.FAILED]: ConfirmStatus.FAILED,
};

const SYSTEM = 'system' as Role;
const USER = 'user' as Role;
const ASSISTANT = 'assistant' as Role;
const TOOL_CALL = 'tool_call' as Role;
const TOOL_RESULT = 'tool_result' as Role;

const ELIDED_GUIDE = '[guide loaded - its rules are in the system prompt]';

const parseToolCall = (content: string | undefined): { name: string; arguments?: Record<string, unknown> } => {
    try {
        const call = JSON.parse(content || '{}');
        return { name: String(call?.name ?? ''), arguments: call?.arguments };
    } catch {
        return { name: '' };
    }
};

/** Standalone-prompt mode: a guide is loaded for as long as the turns sent to the model still carry its load. */
const guidesCarriedBy = (turns: Turn[]): ToolName[] =>
    turns
        .filter((turn) => turn.role === TOOL_CALL)
        .map((turn) => parseToolCall(turn.content))
        .filter((call) => call.name === LOAD_GUIDE_TOOL_NAME && typeof call.arguments?.guide === 'string')
        .map((call) => call.arguments!.guide as ToolName);

/**
 * The chain as history should remember it: every turn verbatim, so the model never re-runs a read it
 * already holds. In composed-prompt mode a guide load's result is the one exception, since the system
 * prompt re-injects that body; a standalone prompt carries no guide, so history keeps it.
 */
const projectChainForHistory = (chainWork: Turn[], keepGuideBodies: boolean): Turn[] => {
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
            calledName = parseToolCall(turn.content).name;
            projected.push(turn);
            continue;
        }
        if (turn.role === TOOL_RESULT) {
            const elideBody = !keepGuideBodies && calledName === LOAD_GUIDE_TOOL_NAME;
            projected.push(elideBody ? { role: TOOL_RESULT, content: ELIDED_GUIDE } : turn);
            continue;
        }
        projected.push(turn);
    }

    return projected;
};

/**
 * Lazily instantiate the Lumo client on first send so `@proton/lumo-api-client` stays out of the
 * shared `@proton/components` bundle until the assistant is actually used (bundle hygiene, plan §6).
 */
let clientPromise: Promise<LumoApiClient> | null = null;
const getLumoClient = (): Promise<LumoApiClient> => {
    if (!clientPromise) {
        clientPromise = import('@proton/lumo-api-client/core/client').then(
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
    const standalonePrompt = !!config.serverPrompt;

    const [items, setItems] = useState<LumoAgentItem[]>([]);
    const [isBusy, setIsBusy] = useState(false);
    // Cleared when a chain starts, so a chain that is abandoned before it reports reads as no outcome
    const [lastChainEnd, setLastChainEnd] = useState<LumoChainEnd | null>(null);
    const [sessionKey, setSessionKey] = useState(0);
    const [draft, setDraft] = useState('');

    const idRef = useRef(0);
    const controllerRef = useRef<AbortController | null>(null);
    // The card the user is being asked about, and the promise its answer settles. One ref, because the
    // tool it proposes and the answer it awaits have exactly the same lifetime.
    const confirmResolveRef = useRef<{ tool: ToolName; resolve: (decision: ConfirmDecision) => void } | null>(null);
    const historyRef = useRef<Turn[]>([]);
    // What the debug transcript copies: every turn verbatim, including guide bodies a composed prompt's history elides.
    const transcriptRef = useRef<Turn[]>([]);
    // The exchange's projected turns, waiting to be banked.
    const projectedChainRef = useRef<Turn[]>([]);
    const replyIdRef = useRef<number | null>(null);
    const replyTextRef = useRef('');
    // Read through a ref so no reporting call site has to depend on `config`. The cleanup effect below
    // would otherwise abort the chain and abandon its card on every render a caller changed config on.
    const telemetryRef = useRef(config.telemetry);
    telemetryRef.current = config.telemetry;

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
        const projected = projectedChainRef.current;
        projectedChainRef.current = [];
        // A trailing tool result is banked as it stands, so a mutation the model never spoke after is
        // still known to have applied.
        if (!projected.length) {
            return;
        }
        historyRef.current = [...historyRef.current, { role: USER, content: userText }, ...projected];
    }, []);

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

    /**
     * Matching on `from` keeps the two hops a card makes distinct, so a late outcome cannot revive one
     * the user has already cancelled. `approvedParams` replace the proposed ones, so the tile reports
     * what ran, not what was offered.
     */
    const advanceLastConfirm = useCallback(
        (from: ConfirmStatus, to: ConfirmStatus, approvedParams?: Record<string, any>) => {
            setItems((prev) => {
                const index = [...prev].reverse().findIndex((item) => item.kind === 'confirm' && item.status === from);
                if (index === -1) {
                    return prev;
                }
                const realIndex = prev.length - 1 - index;
                return prev.map((item, i) =>
                    i === realIndex && item.kind === 'confirm'
                        ? {
                              ...item,
                              status: to,
                              action: approvedParams ? { ...approvedParams, type: item.action.type } : item.action,
                          }
                        : item
                );
            });
        },
        []
    );

    /** Take the pending card, leaving none behind, and report how the user answered it. */
    const takePendingConfirm = useCallback((answer: LumoConfirmAnswer) => {
        const pending = confirmResolveRef.current;
        confirmResolveRef.current = null;
        if (pending) {
            telemetryRef.current?.confirmAnswered(pending.tool, answer);
        }
        return pending;
    }, []);

    const confirm = useCallback(
        (params: Record<string, any>) => {
            const pending = takePendingConfirm(LumoConfirmAnswer.APPLIED);
            if (!pending) {
                return;
            }
            // Not `applied` — the handler has not run yet, and it may still refuse the change.
            advanceLastConfirm(ConfirmStatus.PENDING, ConfirmStatus.APPLYING, params);
            pending.resolve({ action: 'apply', params });
        },
        [advanceLastConfirm, takePendingConfirm]
    );

    /**
     * Settle the pending card; without this the executor awaits it forever. The tile reads cancelled
     * however it was settled, since the change is not going to run, but `answer` keeps the two apart:
     * the user refused it, or they never answered it at all.
     */
    const releasePendingConfirm = useCallback(
        (answer: LumoConfirmAnswer) => {
            const pending = takePendingConfirm(answer);
            if (!pending) {
                return;
            }
            advanceLastConfirm(ConfirmStatus.PENDING, ConfirmStatus.CANCELLED);
            pending.resolve({ action: 'cancel' });
        },
        [advanceLastConfirm, takePendingConfirm]
    );

    const cancel = useCallback(() => releasePendingConfirm(LumoConfirmAnswer.CANCELLED), [releasePendingConfirm]);

    // Every abort reaches the chain the same way (a plain finish or an `AbortError`), so the caller says
    // which one it was. An `AbortError` from anywhere else is the user's own stop as far as the chain can tell.
    const abortEndRef = useRef(LumoChainEnd.STOPPED);

    const abortChain = useCallback((end: LumoChainEnd) => {
        abortEndRef.current = end;
        controllerRef.current?.abort();
        controllerRef.current = null;
    }, []);

    /**
     * End the chain over the head of whoever was answering its card. Nobody answered, so the card is
     * abandoned rather than cancelled, and `end` says which of the four ways it was that took it.
     */
    const abandonChain = useCallback(
        (end: LumoChainEnd) => {
            abortChain(end);
            releasePendingConfirm(LumoConfirmAnswer.ABANDONED);
            setIsBusy(false);
        },
        [abortChain, releasePendingConfirm]
    );

    // The mobile breakpoint unmounts the drawer outright, taking any parked card with it. Aborting
    // first stops the released card from buying the chain another round nobody is rendering.
    useEffect(() => () => abandonChain(LumoChainEnd.DISCARDED), [abandonChain]);

    const stop = useCallback(() => abandonChain(LumoChainEnd.STOPPED), [abandonChain]);

    // Built once per session (per `sessionKey`); holds the reference registry + loaded-guide set so
    // they persist across messages. Confirmations resolve the executor's `ConfirmController` promise.
    const executor = useMemo(() => {
        const references = createReferenceRegistry();
        const byName = new Map(config.definitions.map((definition) => [definition.name, definition]));
        return createClientToolExecutor({
            definitions: config.definitions,
            handlers: config.handlers,
            references,
            standalonePrompt,
            confirm: {
                requestConfirmation: (action, labels) =>
                    new Promise<ConfirmDecision>((resolve) => {
                        finalizeReply();
                        pushItem({ id: nextId(), kind: 'confirm', action, labels, status: ConfirmStatus.PENDING });
                        confirmResolveRef.current = { tool: action.type, resolve };
                    }),
                reportOutcome: (outcome) => advanceLastConfirm(ConfirmStatus.APPLYING, OUTCOME_STATUS[outcome]),
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
    }, [config, standalonePrompt, sessionKey, nextId, pushItem, finalizeReply, advanceLastConfirm]);

    /**
     * Bank what the chain produced, as the transport reports it rather than as the bubbles on screen
     * split it: verbatim for the transcript, projected for history (see {@link projectChainForHistory}).
     */
    const recordChainWork = useCallback(
        (producedTurns: Turn[]) => {
            transcriptRef.current.push(...producedTurns);
            projectedChainRef.current.push(...projectChainForHistory(producedTurns, standalonePrompt));
        },
        [standalonePrompt]
    );

    const runChain = useCallback(
        async (turns: Turn[], userContent: string) => {
            setIsBusy(true);
            setLastChainEnd(null);

            const controller = new AbortController();
            controllerRef.current = controller;

            const startedAt = performance.now();
            // Counted here rather than off the returned turns, because a chain that throws never returns any.
            let toolCalls = 0;
            const reportChainEnd = (end: LumoChainEnd) => {
                // An abandoned chain's late report must not overwrite the outcome its successor owns
                if (controllerRef.current === controller) {
                    setLastChainEnd(end);
                }
                telemetryRef.current?.chainEnded(end, {
                    durationMs: performance.now() - startedAt,
                    toolCalls,
                });
            };

            // A tool can hand over an image mid-chain (the file on screen, say) — a tool result is text
            // only. The chain re-sends its turns every round, so attaching it to the message the user
            // just sent puts it in front of the model on the very next one. It stays on that turn for
            // the rest of the exchange and is dropped with it: history keeps text alone.
            // The bytes carry no id, so the marker goes in the same turn's content — that is the only
            // handle the model has to refer to the picture (same shape as Lumo's own attachments).
            const showImage = ({ imageId, data, name }: ToolImage) => {
                const userTurn = turns.findLast((turn) => turn.role === USER);
                if (!userTurn || userTurn.images?.some((image) => image.image_id === imageId)) {
                    return;
                }
                const image: WireImage = { encrypted: false, image_id: imageId, data };
                userTurn.images = [...(userTurn.images ?? []), image];
                userTurn.content = [userTurn.content, lumoImageMarker(imageId, 'user', name)]
                    .filter(Boolean)
                    .join('\n');
            };

            const serverSources = new Map<string, number>();
            // A refusal or a timeout arrives as a chunk and the stream then finishes cleanly, so the
            // chain returns as though it answered while the user reads an error. Latched here because
            // that is the only place the two are distinguishable.
            let streamFailed = false;

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
                    streamFailed = true;
                    pushError();
                }
            };

            try {
                const client = await getLumoClient();
                if (standalonePrompt) {
                    executor.setLoadedGuides(guidesCarriedBy(turns));
                }
                // The transport also advertises the executor's tools, so composed mode sends them twice;
                // standalone mode leaves the executor the only advertiser.
                const clientTools: ChatCompletionsFunctionTool[] | undefined = standalonePrompt
                    ? undefined
                    : ((await executor.getClientTools?.()) ?? []);
                // The executor is shared across chains, so bind this one's signal to its batches: an
                // abandoned chain must not confirm and run the tail of its batch on the turn that replaced it.
                const { producedTurns } = await client.callAssistant(api, turns, {
                    clientToolExecutor: {
                        ...executor,
                        execute: (calls) => {
                            toolCalls += calls.length;
                            return executor.execute(calls, { signal: controller.signal, showImage });
                        },
                    },
                    ...(clientTools && { clientTools }),
                    serverTools: config.serverTools,
                    ...(config.clientType && { clientType: config.clientType }),
                    signal: controller.signal,
                    chunkCallback,
                });
                // An abandoned chain usually returns normally rather than throw, since the transport
                // reports an abort as a plain finish, so nothing past this point may land on the turn
                // that replaced it.
                if (controllerRef.current !== controller) {
                    reportChainEnd(abortEndRef.current);
                    return;
                }
                recordChainWork(producedTurns);
                commitHistory(userContent);
                reportChainEnd(streamFailed ? LumoChainEnd.FAILED : LumoChainEnd.SUCCEEDED);
            } catch (error: any) {
                const isAbort = error?.name === 'AbortError';
                if (!isAbort) {
                    pushError();
                }
                reportChainEnd(isAbort ? abortEndRef.current : LumoChainEnd.FAILED);
                // Known gap: a failed chain's turns stay inside the transport, so the tool exchanges of
                // the run most worth reporting never reach the transcript.
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
            standalonePrompt,
            executor,
            appendReplyDelta,
            commitHistory,
            recordChainWork,
            finalizeReply,
            nextId,
            pushItem,
            pushError,
        ]
    );

    // With a server prompt the backend supplies the whole system turn, so none is sent.
    const buildSystemTurns = useCallback(
        (): Turn[] =>
            standalonePrompt
                ? []
                : [
                      {
                          role: SYSTEM,
                          content: buildSystemPrompt({
                              definitions: config.definitions,
                              loadedGuides: executor.getLoadedGuides(),
                              productRules: config.productRules?.(),
                          }),
                      },
                  ],
        [config, standalonePrompt, executor]
    );

    const send = useCallback(
        async (message: string) => {
            const text = message.trim();
            if (!text) {
                return;
            }
            // Typing instead of answering the card leaves it unanswered; its chain is parked inside
            // `execute()` and cannot take another message, so this one replaces it.
            if (confirmResolveRef.current) {
                abandonChain(LumoChainEnd.REPLACED);
            } else if (isBusy || controllerRef.current) {
                return;
            }
            telemetryRef.current?.promptSent();

            // Anything the last exchange left unbanked (an abandoned or failed chain) is not this one's.
            projectedChainRef.current = [];
            finalizeReply();
            pushItem({ id: nextId(), kind: 'user', text });
            // The model reads the moment the message was sent; the bubble on screen shows only what was typed.
            const turnContext = standalonePrompt ? config.turnContext?.() : undefined;
            const content = turnContext ? `${turnContext}\n\n${text}` : text;
            transcriptRef.current.push({ role: USER, content });

            await runChain([...buildSystemTurns(), ...historyRef.current, { role: USER, content }], content);
        },
        [config, standalonePrompt, buildSystemTurns, isBusy, finalizeReply, nextId, pushItem, runChain, abandonChain]
    );

    /**
     * The model-facing exchange as one copyable string, for a bug report: the system prompt (unless the server supplies it), then each
     * question, the tool calls and results it drove, and the answer. The diagnostic events the POC
     * interleaved need an event log this hook does not keep, and stay out of scope.
     */
    const getDebugTranscript = useCallback(
        () =>
            [...buildSystemTurns(), ...transcriptRef.current]
                .map((turn) => `===== ${turn.role.toUpperCase()} =====\n${turn.content ?? ''}`)
                .join('\n\n'),
        [buildSystemTurns]
    );

    const clear = useCallback(() => {
        abandonChain(LumoChainEnd.DISCARDED);
        historyRef.current = [];
        transcriptRef.current = [];
        projectedChainRef.current = [];
        replyIdRef.current = null;
        replyTextRef.current = '';
        setItems([]);
        setSessionKey((key) => key + 1);
    }, [abandonChain]);

    return {
        items,
        isBusy,
        lastChainEnd,
        hasConversation: items.length > 0,
        draft,
        setDraft,
        send,
        confirm,
        cancel,
        stop,
        clear,
        getDebugTranscript,
    };
};

export default useLumoAgent;

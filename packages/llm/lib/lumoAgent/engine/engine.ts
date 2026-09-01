import type {
    ChatCompletionsFunctionTool,
    ClientToolExecutor,
    ClientToolResult,
    PendingClientToolCall,
} from '@proton/lumo-api-client';
import getRandomString, { DEFAULT_LOWERCASE_CHARSET } from '@proton/utils/getRandomString';

import { ToolInputError, UnknownReferenceError } from '../contracts/errors';
import type {
    ActionRequest,
    ChipSummary,
    ReferenceLabels,
    ReferenceRegistry,
    ToolDefinition,
    ToolHandlers,
    ToolImage,
    ToolName,
} from '../contracts/types';
import { LOAD_GUIDE_TOOL_NAME, resolveGuide } from './loadGuide';
import { buildToolDescriptors } from './tools';
import { validateToolArgs } from './validate';

/**
 * The framework's tool layer as a {@link ClientToolExecutor} — the port the transport
 * (`@proton/lumo-api-client`) drives its multi-round loop through. The transport owns the round loop;
 * this factory owns the per-call work: advertise, validate, guard, run, confirm mutations, serialise.
 * It stays product-blind — definitions, handlers, and confirm UI are all injected.
 */

/** A reference-shaped token, e.g. `email-a1b2c3` — `<kind>-<6 base36>`. */
const REFERENCE_PATTERN = /^[a-z]+-[0-9a-z]{6}$/;

/**
 * Marks a read payload as content to report on, not instructions to obey. The per-executor nonce keeps the
 * delimiter unguessable, and stripping to a fixed point keeps it unspoofable: one pass would splice the two
 * halves of a bisected closing tag back into a working one.
 */
const createUntrustedFence = () => {
    const tag = `untrusted-data-${getRandomString(8, DEFAULT_LOWERCASE_CHARSET)}`;
    const strip = (payload: string) => {
        let stripped = payload;
        while (stripped.includes(tag)) {
            stripped = stripped.replaceAll(tag, '');
        }
        return stripped;
    };
    return (payload: string) => `<${tag}>\n${strip(payload)}\n</${tag}>`;
};

export type ConfirmDecision = { action: 'apply'; params: Record<string, any> } | { action: 'cancel' };

/**
 * Human-in-the-loop confirmation for mutations, awaited inside `execute()` (the transport has no notion
 * of approval). The (possibly edited) params from an `apply` are what the handler runs with.
 */
export interface ConfirmController {
    requestConfirmation(action: ActionRequest, labels: ReferenceLabels): Promise<ConfirmDecision>;
}

/** A transparency chip emitted per tool run for the product's UI. `payload` is what was fed to the model. */
export interface ToolChip {
    tool: ToolName;
    summary: ChipSummary;
    payload: string;
}

export interface ClientToolExecutorConfig {
    definitions: ToolDefinition[];
    handlers: ToolHandlers;
    references: ReferenceRegistry;
    /** Required for mutations; a mutation call without it is rejected. Omit for a read-only product. */
    confirm?: ConfirmController;
    loadedGuides?: Iterable<ToolName>;
    /** Aliases a call name before dispatch, to absorb common model mistakes (e.g. singular→plural). */
    normalizeName?: (name: string) => string;
    onChip?: (chip: ToolChip) => void;
    onTrace?: (error: unknown) => void;
    loadGuideToolName?: ToolName;
}

const okResult = (content: string): ClientToolResult => ({ content });
const freeResult = (content: string): ClientToolResult => ({ content, billable: false });
const errorResult = (message: string): ClientToolResult => ({
    content: JSON.stringify({ error: message }),
    is_error: true,
});

const parseArgs = (raw: string): unknown => {
    try {
        return JSON.parse(raw || '{}');
    } catch {
        return raw;
    }
};

const unknownReferenceMessage = (reference: string): string =>
    `Unknown reference "${reference}" — it was never returned by an earlier read. Re-read to get valid references, then try again.`;

/**
 * Reject any reference-shaped param value the registry never issued (hallucination guard), skipping the
 * definition's {@link ToolDefinition.freeTextParams} — a keyword like "e-ticket" is reference-shaped but
 * can only ever be free text.
 */
const assertReferencesResolve = (
    params: Record<string, any>,
    references: ReferenceRegistry,
    freeTextParams: readonly string[] = []
): void => {
    const check = (value: any) => {
        if (typeof value === 'string' && REFERENCE_PATTERN.test(value) && !references.has(value)) {
            throw new UnknownReferenceError(value);
        } else if (Array.isArray(value)) {
            value.forEach(check);
        }
    };
    Object.entries(params)
        .filter(([param]) => !freeTextParams.includes(param))
        .forEach(([, value]) => check(value));
};

/** Map each reference-shaped param value to its display description, for the confirm card. */
const collectLabels = (params: Record<string, any>, references: ReferenceRegistry): ReferenceLabels => {
    const labels: ReferenceLabels = {};
    const collect = (value: any) => {
        if (typeof value === 'string' && REFERENCE_PATTERN.test(value)) {
            const label = references.labelFor(value);
            if (label) {
                labels[value] = label;
            }
        } else if (Array.isArray(value)) {
            value.forEach(collect);
        }
    };
    Object.values(params).forEach(collect);
    return labels;
};

/** Per-batch wiring: both entries belong to the chain that started the batch, not to the executor. */
interface ExecuteOptions {
    /**
     * Scopes a batch to the chain that started it. Once it aborts, the remaining calls are skipped
     * rather than confirmed and run against whatever turn has replaced that chain.
     */
    signal?: AbortSignal;
    /** Where a handler's {@link ToolDeps.showImage} lands — the chain decides what it does with it. */
    showImage?: (image: ToolImage) => void;
}

export interface LumoClientToolExecutor extends ClientToolExecutor {
    getLoadedGuides(): ToolName[];
    execute(calls: PendingClientToolCall[], options?: ExecuteOptions): Promise<ClientToolResult[]>;
}

export const createClientToolExecutor = (config: ClientToolExecutorConfig): LumoClientToolExecutor => {
    const {
        definitions,
        handlers,
        references,
        confirm,
        normalizeName,
        onChip,
        onTrace,
        loadGuideToolName = LOAD_GUIDE_TOOL_NAME,
    } = config;

    const fenceUntrusted = createUntrustedFence();
    const byName = new Map<ToolName, ToolDefinition>(definitions.map((definition) => [definition.name, definition]));
    // Widens as `load_guide` runs; getClientTools() re-reads it each round so a just-unlocked tool is
    // advertised on the next turn.
    const loadedGuides = new Set<ToolName>(config.loadedGuides ?? []);

    /**
     * Guard params against hallucinated references, converting the {@link UnknownReferenceError} into a
     * tool error result the model can recover from. Returns `undefined` when everything resolves; any
     * other error propagates.
     */
    const guardReferences = (definition: ToolDefinition, params: Record<string, any>): ClientToolResult | undefined => {
        try {
            assertReferencesResolve(params, references, definition.freeTextParams);
        } catch (error) {
            if (error instanceof UnknownReferenceError) {
                return errorResult(unknownReferenceMessage(error.reference));
            }
            throw error;
        }
    };

    const runHandler = async (
        definition: ToolDefinition,
        params: Record<string, any>,
        options?: ExecuteOptions
    ): Promise<{ ok: true; payload: string } | { ok: false; error: ClientToolResult }> => {
        const handler = handlers[definition.name];
        if (!handler) {
            onTrace?.(new Error(`No handler registered for tool "${definition.name}".`));
            return { ok: false, error: errorResult(`The tool "${definition.name}" is not available.`) };
        }
        // A handler that outlived its chain has nowhere to put a chip or image; the turn it belonged to is
        // gone. Checked at call time (not up front) since a handler can call `showImage` mid-run, before
        // the chain it started in aborts.
        const showImage = options?.showImage
            ? (image: ToolImage) => {
                  if (!options.signal?.aborted) {
                      options.showImage?.(image);
                  }
              }
            : undefined;
        try {
            const result = await handler(params, { references, showImage });
            const payload = definition.serializeForLumo(result, references);
            if (!options?.signal?.aborted) {
                onChip?.({ tool: definition.name, summary: definition.summarizeChip(params, result), payload });
            }
            return { ok: true, payload };
        } catch (error: any) {
            if (error instanceof UnknownReferenceError) {
                return { ok: false, error: errorResult(unknownReferenceMessage(error.reference)) };
            }
            // The model chose a bad param and the handler said how to fix it — pass that through, or the
            // model only learns the call failed and re-issues it unchanged.
            if (error instanceof ToolInputError) {
                return { ok: false, error: errorResult(error.message) };
            }
            onTrace?.(error);
            return { ok: false, error: errorResult(`The ${definition.name} tool failed. Try a different approach.`) };
        }
    };

    const runLoadGuide = (args: Record<string, any>): ClientToolResult => {
        const target = args.guide as ToolName;
        const targetDefinition = byName.get(target);
        if (!targetDefinition?.guide) {
            return errorResult(`There is no guide for "${target}".`);
        }
        if (loadedGuides.has(target)) {
            return okResult(`The ${target} guide is already loaded. Call ${target} now; do not load it again.`);
        }

        loadedGuides.add(target);
        const guide = resolveGuide(targetDefinition);
        if (!guide) {
            return freeResult(`There is no extra guidance for ${target}. It is now available — call it as described.`);
        }
        const loadGuide = byName.get(loadGuideToolName);
        onChip?.({
            tool: loadGuideToolName,
            summary: loadGuide?.summarizeChip(args, undefined as never) ?? { label: `Loaded guide for ${target}` },
            payload: guide,
        });
        return freeResult(
            `Usage guide for ${target} — its tool is now available, and you MUST follow this guide every time you call it. Call it now to continue the work; never reply to the user about this guide.\n\n${guide}`
        );
    };

    const executeOne = async (call: PendingClientToolCall, options?: ExecuteOptions): Promise<ClientToolResult> => {
        const definition = byName.get(call.name);
        if (!definition) {
            return errorResult(`Unknown tool "${call.name}". Use one of the provided tools.`);
        }

        const validation = validateToolArgs(definition.paramsSchema, parseArgs(call.arguments));
        if (!validation.ok) {
            return errorResult(validation.error);
        }
        const args = validation.value;

        const argsError = guardReferences(definition, args);
        if (argsError) {
            return argsError;
        }

        if (definition.name === loadGuideToolName) {
            return runLoadGuide(args);
        }

        if (definition.kind === 'mutation') {
            if (!confirm) {
                onTrace?.(new Error(`Mutation "${definition.name}" called but no confirm controller is configured.`));
                return errorResult(`The tool "${definition.name}" is not available.`);
            }
            const action: ActionRequest = { type: definition.name, ...args };
            const decision = await confirm.requestConfirmation(action, collectLabels(action, references));
            if (decision.action === 'cancel') {
                return okResult('The user declined that change.');
            }
            const editedParams = decision.params;
            const editedError = guardReferences(definition, editedParams);
            if (editedError) {
                return editedError;
            }
            const applied = await runHandler(definition, editedParams, options);
            if (!applied.ok) {
                return applied.error;
            }
            // A create_* tool serialises the new entity's reference here so the model can chain a
            // follow-up without a re-read; other mutations serialise to ''.
            const detail = applied.payload;
            return okResult(`Applied ${definition.name} successfully.${detail ? ` ${detail}` : ''}`);
        }

        const read = await runHandler(definition, args, options);
        return read.ok ? okResult(fenceUntrusted(read.payload)) : read.error;
    };

    return {
        getClientTools: async (): Promise<ChatCompletionsFunctionTool[]> =>
            buildToolDescriptors(definitions, loadedGuides),
        getLoadedGuides: () => [...loadedGuides],
        canExecute: (name) => byName.has(name),
        normalizeCalls: normalizeName
            ? (calls) => calls.map((call) => ({ ...call, name: normalizeName(call.name) }))
            : (calls) => calls,
        // Sequential, not parallel: a mutation must clear its confirm card before the next call, and the
        // transport zips results to calls by index. A batch keeps walking after its chain is abandoned —
        // the abort is only observed once the parked call resolves — so re-check the signal every round.
        execute: async (calls, options) => {
            const signal = options?.signal;
            const results: ClientToolResult[] = [];
            for (const call of calls) {
                results.push(
                    signal?.aborted ? errorResult('The user cancelled that.') : await executeOne(call, options)
                );
            }
            return results;
        },
    };
};

/**
 * Core contracts for the Lumo agent framework — the product-blind tool-routing harness.
 *
 * The harness gives the model a *catalogue* of tools. The model requests the tool(s) it needs; the
 * harness runs a handler per tool to fetch (reads) or apply (mutations) only what was asked for; the
 * result is fed back and the model either requests more or proposes a mutation to confirm. Nothing is
 * sent to the model that a tool did not explicitly request.
 *
 * This package is **product-blind**: it enumerates no product's tool names and holds no product's
 * domain rules. Each product supplies its own tool pack (definitions + handlers + confirm cards) and
 * registers it with an instance of the framework.
 *
 * Layering (dependency direction: applications/<product> -> @proton/components -> @proton/llm):
 *   - This file and the tool DEFINITIONS live in @proton/llm and are pure (no store access).
 *   - The concrete tool HANDLERS ({@link ToolHandler}) are supplied by the product because they
 *     touch that product's store; a definition and its handler are matched by {@link ToolName}.
 *   - The loop controller + UI live in @proton/components; the product's confirm cards live in the
 *     product.
 */

/** A JSON Schema fragment. Kept loose (as the transport does) — schemas are authored as literals. */
export type JSONSchema = Record<string, any>;

/** Reads run automatically; mutations require an explicit review-edit-confirm from the user. */
type ToolKind = 'read' | 'mutation';

/**
 * A tool identifier — an **open** string. The framework never enumerates any product's tools: a
 * definition (in @proton/llm) and its handler (in the product) are matched by this name, and a product
 * is free to define its own union of its own names and type its registry against it. That union stays
 * inside the product; the framework only ever sees a `string`.
 */
export type ToolName = string;

/**
 * A reference kind — an **open** string prefix (e.g. `email`, `folder`, a product's own kinds). The
 * framework mints references as `<kind>-<random>` and stays blind to what a kind means; the product
 * chooses its kinds.
 */
export type ReferenceKind = string;

/**
 * How a reference is described to a human — the model never sees any of it. `title` is the primary
 * name (email subject, folder/label name); the rest is whatever else a card has room for.
 */
export interface ReferenceLabel {
    title: string;
    subtitle?: string;
    /** Machine-readable and locale-free (e.g. an ISO timestamp), so the card can format it for its reader. */
    meta?: string;
}

/** Display descriptions keyed by the reference they describe, as handed to a confirm card. */
export type ReferenceLabels = Record<string, ReferenceLabel>;

/**
 * Maps references (`email-a3f9k2`, `folder-x7b2q1`, …) to real backend IDs, append-only for the
 * session: the same real ID always yields the same reference, so references stay stable across turns
 * even after the read that introduced them is evicted from the working set. The random id (not a
 * sequential counter) means the model cannot guess the "next" reference — an unissued reference can
 * only be a hallucination, and is rejected before the API is touched.
 */
export interface ReferenceRegistry {
    /**
     * Return the stable reference for a real backend id, minting one on first sight. `label` is the
     * optional display-only description (the confirm card renders it instead of the raw reference);
     * it never affects id resolution.
     */
    referenceFor(kind: ReferenceKind, id: string, label?: ReferenceLabel): string;
    /** Resolve a reference back to its real id, or `undefined` if the reference was never issued. */
    idFor(reference: string): string | undefined;
    /** The display description recorded for a reference, or `undefined` if none was supplied. */
    labelFor(reference: string): ReferenceLabel | undefined;
    /** Whether a reference has been issued this session. */
    has(reference: string): boolean;
}

/**
 * One authored few-shot example for a tool — a scenario plus the correct call JSON. Injected into
 * the request context only for the tools active in a turn (progressive disclosure), so the model
 * sees the right call shape up front without every tool's examples always in context.
 */
interface ToolExample {
    /** The situation / what the model already knows (e.g. "search returned email-a1b2c3 …"). */
    context: string;
    /** The correct arguments object the model should call this tool with in that situation. */
    call: Record<string, any>;
}

/** The compact, always-visible summary rendered on a tool chip in the chat. */
export interface ChipSummary {
    /** e.g. "Read 12 emails on screen". The exact payload sent to the model is shown on expansion. */
    label: string;
}

/**
 * A pure tool definition. Everything here is store-free: `serializeForLumo` and `summarizeChip`
 * format a plain, already-computed {@link Result} (produced by the product-side handler) — they never
 * read the store themselves.
 *
 * @typeParam Params - the params the model emits for this tool (constrained by {@link paramsSchema}).
 * @typeParam Result - the plain, serialisable data the handler returns for this tool.
 */
export interface ToolDefinition<Params = any, Result = any> {
    name: ToolName;
    kind: ToolKind;
    /**
     * The tool descriptor's `description` — the model's primary guidance for this tool. Held to
     * tool-schema best practice: what the tool does AND when to use / not use it (disambiguating it
     * from its neighbours), with a short inline example where that helps. This is how the model learns
     * the tool, so it carries the trap-avoidance wording; the JSON contract itself lives in
     * {@link paramsSchema}.
     */
    toolDescription: string;
    /**
     * Whether this tool has a large usage guide that must be loaded before the model can use it well.
     * When true, {@link guide} is present and the tool is only advertised (its
     * {@link paramsSchema} enters the active tool list) once the model pulls the guide via `load_guide`.
     */
    needsGuide?: boolean;
    /**
     * The full usage doc, injected into context only when the tool's guide is loaded. A thunk when the
     * body depends on state that can change mid-conversation: it is resolved on the `load_guide` call and
     * on each system-prompt build (one per user message, not per round). A thunk that throws or returns
     * nothing unblocks its tool without a body.
     */
    guide?: string | (() => string);
    /** JSON schema for this tool's params — the single source of truth for both the tool descriptor's
     *  `parameters` and the validation middleware. Kept `$ref`-free with `additionalProperties: false`. */
    paramsSchema: JSONSchema;
    /**
     * Params carrying free text rather than references, exempted from the hallucination guard. Free text
     * can be shaped exactly like a reference (`e-ticket` matches `<kind>-<6 base36>`), and the guard would
     * then reject the call outright. Naming a param here is safe only because the guard is what stops a
     * hallucinated id reaching the API — so list the ones that can never hold an id, and nothing else.
     */
    freeTextParams?: readonly string[];
    /**
     * Few-shot examples of correct usage, injected into the system prompt for this tool ONLY when it
     * is active in the turn (progressive disclosure — keeps inactive guided-tool examples out of
     * context). Additive: leaving it undefined is fine.
     */
    examples?: ToolExample[];
    /** Concise text fed back to the model. Uses the {@link ReferenceRegistry} to render real ids as references. */
    serializeForLumo(result: Result, references: ReferenceRegistry): string;
    /** The transparency chip shown for this tool's run. */
    summarizeChip(params: Params, result: Result): ChipSummary;
}

/**
 * A product-side handler for a tool: reads the store / drives the product / applies a mutation and
 * returns the plain {@link Result} that the definition serialises. Handlers resolve incoming
 * references to real ids via `deps.references` and throw `UnknownReferenceError` for unknown
 * references before touching the API.
 */
export type ToolHandler<Params = any, Result = any> = (params: Params, deps: ToolDeps) => Promise<Result>;

/**
 * An image a tool can put in front of the model. `data` is base64, as every transport wants it.
 * Domain contract, not the wire shape: the transport's `WireImage` (`@proton/lumo-api-client`) adds
 * `encrypted`, which a tool image never sets — tool images are always plaintext. Whoever forwards this
 * into `WireTurn.images` maps `imageId` -> `image_id` and supplies `encrypted: false`.
 */
export interface ToolImage {
    imageId: string;
    data: string;
    name?: string;
}

/** Dependencies handed to every handler by the engine at run time. */
interface ToolDeps {
    references: ReferenceRegistry;
    /**
     * Show the model an image for the rest of this exchange. A tool result is text, so this is the only
     * way to hand over something that can only be looked at. Absent when the host cannot send images.
     */
    showImage?: (image: ToolImage) => void;
}

/** The injected registry of handlers, keyed by {@link ToolName}. Assembled in the product. */
export type ToolHandlers = Partial<Record<ToolName, ToolHandler>>;

/**
 * An OpenAI-shape client function-tool descriptor: what the engine advertises to the model for a
 * tool active this turn. This mirrors the transport's `ChatCompletionsFunctionTool` shape but is
 * declared here so the pure framework depends on a transport *interface*, not on transport internals
 * — a descriptor built here is structurally assignable to the transport's `clientTools` type.
 */
export interface ToolDescriptor {
    type: 'function';
    function: {
        name: string;
        description?: string;
        parameters: JSONSchema;
    };
}

// ---------------------------------------------------------------------------------------------
// The mutation the engine holds for confirmation.
// ---------------------------------------------------------------------------------------------

/**
 * A proposed mutation: the tool name (as `type`) plus its validated params. The engine surfaces this
 * on the review-edit-confirm card; on Apply it is dispatched to the mutation's handler.
 */
export interface ActionRequest {
    type: ToolName;
    [param: string]: any;
}

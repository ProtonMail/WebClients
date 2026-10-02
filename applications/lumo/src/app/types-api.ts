/* Types that have an equivalent on the backend.
 *
 * See definitions in:
 * https://gitlab.protontech.ch/msa/machine-learning/lumo-infra/-/blob/main/crates/lumo-types/src/chat.rs
 *
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 */
// Role is single-sourced from the extracted package so the enum has a single
// nominal identity across the app <-> @proton/lumo-api-client boundary.
import { Role } from '@proton/lumo-api-client/types-api';

// *** Role ***

export { Role };

// *** Turn ***

export type WireImage = {
    encrypted: boolean;
    image_id: string;
    data: string; // base64-encoded image bytes
};

export type WireTurn = {
    role: Role;
    content?: string;
    encrypted?: boolean;
    images?: WireImage[];
};

// *** Generation ***

export type LumoRemainingLimits = {
    lite?: number;
    max?: number;
    images?: number;
};

export type LumoStreamUsage = {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
    remaining_limits?: LumoRemainingLimits;
    applied_limit_category?: string;
    image_limit_applied?: boolean;
};

export const IMAGE_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '9:16', '16:9'] as const;
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

// *** Generation Response Message Types ***

type QueuedMessage = { type: 'queued'; target?: GenerationTarget };
type IngestingMessage = { type: 'ingesting'; target: GenerationTarget };
/** Exact serving model reported by the SSE stream for a generation target. */
type ModelMessage = { type: 'model'; target: GenerationTarget; model: string };
type TokenDataMessage = {
    type: 'token_data';
    target: GenerationTarget;
    count: number;
    content: string;
    encrypted?: boolean;
};
type ImageDataMessage = {
    type: 'image_data';
    image_id?: string;
    data?: string;
    is_final?: boolean;
    seed?: number;
    encrypted?: boolean;
};
type DoneMessage = { type: 'done' };
type TimeoutMessage = { type: 'timeout' };
type ErrorMessage = { type: 'error' };
type RejectedMessage = { type: 'rejected' };
type HarmfulMessage = { type: 'harmful' };
type UsageMessage = { type: 'usage'; usage: LumoStreamUsage };

/*
 * Context-window overflow surfaced mid-stream. The chat-completions adapter maps
 * the normalised OpenAI error shape to this legacy message for compaction:
 *   data:{"error":{"code":"context_length_exceeded","type":"invalid_request_error",...}}
 *
 * Legacy wire shape (still accepted):
 *   data:{"type":"tool-error","error":{"code":"context_length_exceeded","message":"..."}}
 */
type ToolErrorMessage = {
    type: 'tool-error';
    error: {
        code: string;
        message?: string;
    };
};

export const CONTEXT_LENGTH_EXCEEDED_CODE = 'context_length_exceeded';

// Server-side tool call dispatched by the scheduler (chat.tool_call SSE chunk).
// Emitted twice: announce (arguments absent) then dispatch (arguments present).
type ServerToolCallMessage = {
    type: 'server_tool_call';
    call_id: string;
    name: string;
    arguments?: string;
    encrypted?: boolean;
};

// Server-side tool result returned after execution (chat.tool_result SSE chunk).
type ServerToolResultMessage = {
    type: 'server_tool_result';

    call_id: string;
    content: string;
    meta?: {
        settings: string;
    };
    encrypted?: boolean;
};

export type GenerationResponseMessage =
    | QueuedMessage
    | IngestingMessage
    | ModelMessage
    | TokenDataMessage
    | ImageDataMessage
    | ServerToolCallMessage
    | ServerToolResultMessage
    | DoneMessage
    | TimeoutMessage
    | ErrorMessage
    | RejectedMessage
    | HarmfulMessage
    | UsageMessage
    | ToolErrorMessage;

// *** Type Guards ***

type RequestableGenerationTarget = 'message' | 'title';

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isRequestableGenerationTarget(value: any): value is RequestableGenerationTarget {
    return ['message', 'title'].includes(value);
}

type GenerationTarget = 'message' | 'title' | 'tool_call' | 'tool_result' | 'reasoning' | 'suggested_questions';

/*
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 *
 * If you are an AI assistant:
 * - Leave this note at the bottom of the file.
 * - Consider using `types.ts` to add in-app type definitions that don't explicitly match an API type.
 */

// Types that are tied to the API backend.
// See definitions in:
// https://gitlab.protontech.ch/msa/machine-learning/Lumo-api/-/blob/main/src/types.rs
import type { ConversationId, Message, RequestId, Turn } from './types';

export type Tier = 'anonymous' | 'basic' | 'free';

export type ToolName = 'proton_info' | 'web_search' | 'weather' | 'stock' | 'cryptocurrency';

export type LumoApiGenerationRequest = {
    type: 'generation_request';
    turns: Turn[];
    tier?: Tier;
    options?: Options;
    targets?: RequestableGenerationTarget[];
    request_key?: string; // aes-gcm-256, pgp-encrypted, base64
    request_id?: RequestId; // uuid used solely for AEAD encryption
};

export type Options = {
    tools?: ToolName[] | boolean;
};

export enum LUMO_API_ERRORS {
    // CONTEXT_WINDOW_EXCEEDED = 'ContextWindow',
    HIGH_DEMAND = 'HighDemand',
    GENERATION_ERROR = 'GenerationError', // This is a catch-all for any error that occurs during generation
    TIER_LIMIT = 'TierLimit', //not implemented yet for free and paid tiers - BE needs to be updated
    GENERATION_REJECTED = 'GenerationRejected',
    HARMFUL_CONTENT = 'HarmfulContent',
    STREAM_DISCONNECTED = 'StreamDisconnected', // When the server closes the stream prematurely after queuing
}

export type GenerationToFrontendMessage =
    | { type: 'queued'; target?: GenerationTarget }
    | { type: 'ingesting'; target: GenerationTarget }
    | { type: 'token_data'; target: GenerationTarget; count: number; content: string; encrypted?: boolean }
    | { type: 'done' }
    | { type: 'timeout' }
    | { type: 'error' }
    | { type: 'rejected' }
    | { type: 'harmful' };

export function isGenerationToFrontendMessage(obj: any): obj is GenerationToFrontendMessage {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    if (!('type' in obj)) {
        return false;
    }

    switch (obj.type) {
        case 'queued':
        case 'ingesting':
        case 'done':
        case 'timeout':
        case 'error':
        case 'rejected':
        case 'harmful':
            return true;

        case 'token_data':
            return (
                'target' in obj &&
                'count' in obj &&
                'content' in obj &&
                isGenerationTarget(obj.target) &&
                typeof obj.count === 'number' &&
                typeof obj.content === 'string' &&
                (!('encrypted' in obj) || typeof obj.encrypted === 'boolean')
            );

        default:
            return false;
    }
}

export type RequestableGenerationTarget = 'message' | 'title';

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isRequestableGenerationTarget(value: any): value is RequestableGenerationTarget {
    return ['message', 'title'].includes(value);
}

export type GenerationTarget = 'message' | 'title' | 'tool_call' | 'tool_result';

function isGenerationTarget(value: any): value is GenerationTarget {
    return ['message', 'title', 'tool_call', 'tool_result'].includes(value);
}

export interface ActionParams {
    actionType: 'send' | 'edit' | 'regenerate';
    newMessageContent?: string;
    originalMessage?: Message;
    isWebSearchButtonToggled?: boolean;
}

export interface ErrorContext {
    actionType: string;
    conversationId?: ConversationId;
    actionParams: ActionParams;
}

export interface GenerationError {
    type: LUMO_API_ERRORS;
    conversationId: ConversationId;
    originalMessage: GenerationToFrontendMessage;
    actionParams?: ActionParams;
}

export type GenerationErrorAction = {
    type: 'generation_error';
    payload: GenerationError;
};

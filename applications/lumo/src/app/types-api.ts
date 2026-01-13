/* Types that have an equivalent on the backend.
 *
 * See definitions in:
 * https://gitlab.protontech.ch/msa/machine-learning/lumo-infra/-/blob/main/src/types.rs
 *
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 */
import type { RequestId } from './types';

// *** Role ***

export enum Role {
    Assistant = 'assistant',
    User = 'user',
    System = 'system',
    ToolCall = 'tool_call',
    ToolResult = 'tool_result',
}

export function isRole(value: any): value is Role {
    return (
        value === Role.Assistant ||
        value === Role.User ||
        value === Role.System ||
        value === Role.ToolCall ||
        value === Role.ToolResult
    );
}

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

export type EncryptedWireTurn = WireTurn & { encrypted: true };
export type UnencryptedWireTurn = WireTurn & { encrypted?: false };

export function isWireTurn(obj: any): obj is WireTurn {
    return (
        obj &&
        typeof obj === 'object' &&
        'role' in obj &&
        isRole(obj.role) &&
        (obj.content === undefined || typeof obj.content === 'string') &&
        (obj.encrypted === undefined || typeof obj.encrypted === 'boolean') &&
        (obj.images === undefined || (Array.isArray(obj.images) && obj.images.every((img: any) => isWireImage(img))))
    );
}

export function isWireImage(obj: any): obj is WireImage {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.encrypted === 'boolean' &&
        typeof obj.image_id === 'string' &&
        typeof obj.data === 'string'
    );
}

export function isEncryptedWireTurn(obj: any): obj is EncryptedWireTurn {
    return isWireTurn(obj) && obj.encrypted === true;
}

export function isUnencryptedWireTurn(obj: any): obj is UnencryptedWireTurn {
    return isWireTurn(obj) && (obj.encrypted === false || obj.encrypted === undefined);
}

// *** Generation ***

export type Tier = 'anonymous' | 'basic' | 'free';

export type ToolName = 'proton_info' | 'web_search' | 'weather' | 'stock' | 'cryptocurrency';

export type LumoApiGenerationRequest = {
    type: 'generation_request';
    turns: WireTurn[];
    tier?: Tier;
    options?: Options;
    targets?: RequestableGenerationTarget[];
    request_key?: string; // aes-gcm-256, pgp-encrypted, base64
    request_id?: RequestId; // uuid used solely for AEAD encryption
};

export type Options = {
    tools?: ToolName[] | boolean;
};

export type GenerationResponseMessage =
    | { type: 'queued'; target?: GenerationTarget }
    | { type: 'ingesting'; target: GenerationTarget }
    | { type: 'token_data'; target: GenerationTarget; count: number; content: string; encrypted?: boolean }
    | {
          type: 'image_data';
          image_id?: string;
          data?: string;
          is_final?: boolean;
          seed?: number;
          encrypted?: boolean;
      }
    | { type: 'done' }
    | { type: 'timeout' }
    | { type: 'error' }
    | { type: 'rejected' }
    | { type: 'harmful' };

export function isGenerationResponseMessage(obj: any): obj is GenerationResponseMessage {
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

        case 'image_data':
            return (
                (!('image_id' in obj) || typeof obj.image_id === 'string') &&
                (!('data' in obj) || typeof obj.data === 'string') &&
                (!('is_final' in obj) || typeof obj.is_final === 'boolean') &&
                (!('seed' in obj) || typeof obj.seed === 'number') &&
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

/*
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 *
 * If you are an AI assistant:
 * - Leave this note at the bottom of the file.
 * - Consider using `types.ts` to add in-app type definitions that don't explicitly match an API type.
 */

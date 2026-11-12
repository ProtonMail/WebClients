import type { Api } from '@proton/shared/lib/interfaces/Api';

import type {
    ChatCompletionsRequest,
    LumoModelsListResponse,
    LumoRemainingLimits,
    LumoUsageLimitsResponse,
} from '../types-api';
import type { GenerationRecoveryState } from './recovery';

export const LUMO_CHAT_ENDPOINT = 'ai/v1/chat/completions';
export const LUMO_LIMITS_ENDPOINT = 'ai/v1/limits';
export const LUMO_MODELS_ENDPOINT = 'ai/v1/models';

/**
 * Call the chat completions endpoint.
 */
export async function callChatEndpoint(
    api: Api,
    payload: ChatCompletionsRequest,
    options: {
        endpoint?: string;
        signal?: AbortSignal;
        recovery?: GenerationRecoveryState;
    } = {}
): Promise<ReadableStream> {
    const { endpoint, signal, recovery } = options;

    const finalEndpoint = endpoint || LUMO_CHAT_ENDPOINT;

    console.log('%c[Endpoint] Using endpoint: %c%s', 'color: blue; font-weight: bold', 'color: black', finalEndpoint);

    const response = await api({
        url: finalEndpoint,
        method: 'post',
        data: recovery ? { ...payload, lumo: { ...payload.lumo, job_id: recovery.jobId, resumable: true } } : payload,
        ...(recovery ? { headers: { 'x-lumo-resume-token': recovery.token } } : {}),
        signal,
        output: 'stream',
        silence: true,
        // Answer Now commits headers immediately; this timer ends at headers and
        // does not limit the lifetime of its queued stream.
        // The scheduler withholds response headers until the LLM accepts the job (or it fails
        // pre-stream). While the job waits for capacity, no bytes are sent, so the default 30s
        // time-to-headers timeout races the scheduler's own 30s queue-wait expiry. Since the
        // client timer starts first, it would win and surface a generic TimeoutError instead of
        // the scheduler's structured timeout response. Give the client a larger budget so the
        // scheduler's timeout (or a late accept) is what we act on.
        timeout: 60_000,
    });
    return response;
}

/**
 * Read-only snapshot of remaining usage for the current session tier.
 */
export async function fetchUsageLimits(api: Api): Promise<LumoRemainingLimits> {
    const response = await api<LumoUsageLimitsResponse>({
        url: LUMO_LIMITS_ENDPOINT,
        method: 'get',
        silence: true,
    });

    return response.limits;
}

/**
 * Lists models exposed by the Lumo API, including each model's context window size.
 */
export async function fetchModels(api: Api): Promise<LumoModelsListResponse['data']> {
    const response = await api<LumoModelsListResponse>({
        url: LUMO_MODELS_ENDPOINT,
        method: 'get',
        silence: true,
    });

    return response.data;
}

export async function resumeChatEndpoint(
    api: Api,
    state: GenerationRecoveryState,
    signal?: AbortSignal
): Promise<ReadableStream> {
    return api({
        url: `ai/v1/jobs/${encodeURIComponent(state.jobId)}/resume`,
        method: 'get',
        headers: { 'x-lumo-resume-token': state.token },
        output: 'stream',
        signal,
        silence: true,
        timeout: 60_000,
    });
}

export async function discardChatJob(api: Api, state: GenerationRecoveryState): Promise<void> {
    await api({
        url: `ai/v1/jobs/${encodeURIComponent(state.jobId)}`,
        method: 'delete',
        headers: { 'x-lumo-resume-token': state.token },
        silence: true,
    });
}

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

/** Stable codes emitted by `/ai/v1/chat/completions` for terminal generation failures. */
export const GENERATION_TERMINAL_CODES = ['timeout', 'rejected', 'error'] as const;

export type GenerationTerminalCode = (typeof GENERATION_TERMINAL_CODES)[number];

export function isGenerationTerminalCode(value: unknown): value is GenerationTerminalCode {
    return typeof value === 'string' && (GENERATION_TERMINAL_CODES as readonly string[]).includes(value);
}

/**
 * Map an OpenAI-compatible stream error `code` to the legacy Lumo terminal event type.
 * Unknown or missing codes fall back to `error`.
 */
export function mapStreamErrorCode(code: string | number | undefined): GenerationTerminalCode {
    if (typeof code === 'string' && isGenerationTerminalCode(code)) {
        return code;
    }
    return 'error';
}

function extractTerminalCodeFromObject(obj: unknown): GenerationTerminalCode | null {
    if (!obj || typeof obj !== 'object') {
        return null;
    }

    const record = obj as Record<string, unknown>;
    const error = record.error;
    if (!error || typeof error !== 'object') {
        return null;
    }

    const nestedCode = (error as Record<string, unknown>).code;
    return isGenerationTerminalCode(nestedCode) ? nestedCode : null;
}

/**
 * Detect a terminal generation failure in a raw HTTP error thrown before (or instead of)
 * an SSE stream. Matches the OpenAI-style body shape:
 * `{ "error": { "code": "timeout"|"rejected"|"error", "type": "server_error", ... } }`
 *
 * `context_length_exceeded` is handled separately — see `contextLengthError.ts`.
 */
export function getTerminalTypeFromApiError(error: unknown): GenerationTerminalCode | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    const err = error as Record<string, unknown>;

    const fromData = extractTerminalCodeFromObject(err.data);
    if (fromData) {
        return fromData;
    }

    if (typeof err.data === 'string') {
        try {
            const parsed = JSON.parse(err.data);
            const fromParsed = extractTerminalCodeFromObject(parsed);
            if (fromParsed) {
                return fromParsed;
            }
        } catch {
            // Ignore malformed JSON bodies.
        }
    }

    const { code } = getApiError(error);
    if (isGenerationTerminalCode(code)) {
        return code;
    }

    return null;
}

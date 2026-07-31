import type { ClientToolExecutor } from '@proton/lumo-api-client';

import { type ParsedArtifact, type StreamingArtifact, hashArtifactIdentity } from './parseArtifacts';
import { parsePartialFlatJsonStringObject } from './parsePartialJson';

export const CREATE_ARTIFACT_TOOL_NAME = 'create_artifact';

export const createArtifactToolExecutor: ClientToolExecutor = {
    getClientTools: async () => [
        {
            type: 'function',
            function: {
                name: CREATE_ARTIFACT_TOOL_NAME,
                description:
                    'Show a code snippet or document to the user in a dedicated side panel, instead of ' +
                    'inline in the chat. This does not change what you write, only where it is shown — it ' +
                    'applies to ordinary writing tasks too, not just code: a drafted email, letter, cover ' +
                    'letter, essay, or report is a "document" for this tool just as much as a script is. Use ' +
                    'it for substantial, self-contained content the user is likely to copy, send, or reuse — ' +
                    'even if they never say "artifact" or "panel" and only asked you to "write" or "draft" ' +
                    'something. Do NOT use it for short code snippets (1-2 lines) used to illustrate a point, ' +
                    'brief structured answers (a small table, a short list), or content that only makes ' +
                    'sense as part of your explanation — write those inline instead. To revise something you ' +
                    'already created earlier in this conversation, call this again with the exact same `id` ' +
                    'and the full updated content (never a diff or partial update); use a new `id` only for ' +
                    "a genuinely new, unrelated artifact. If the user's message references an artifact by " +
                    'its id, reuse that same id. Write a brief intro in your reply before calling this.',
                parameters: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description:
                                'A short lowercase-kebab-case slug (2-4 words, e.g. "report-outline") that ' +
                                'stably identifies this artifact. Reuse the exact same value across turns ' +
                                'when revising it.',
                        },
                        type: { type: 'string', enum: ['code', 'document'] },
                        title: {
                            type: 'string',
                            description: 'Title case, 2-5 words, describing the content.',
                        },
                        language: {
                            type: 'string',
                            description: 'Programming language, only when type is "code" (e.g. python, typescript).',
                        },
                        // Declared last: models tend to emit object keys in schema order, and this is
                        // typically the longest field, which matters for how much of it streams live
                        // before the tool call is complete.
                        content: { type: 'string', description: 'The full artifact content.' },
                    },
                    required: ['id', 'type', 'title', 'content'],
                    additionalProperties: false,
                },
            },
        },
    ],
    canExecute: (name) => name === CREATE_ARTIFACT_TOOL_NAME,
    execute: async (calls) => {
        return calls.map(() => ({
            content: JSON.stringify({
                ok: true,
                message:
                    "Artifact created and is now shown to the user in the side panel — don't repeat its " +
                    'content in your reply. Continue with a brief confirmation or anything else relevant, or ' +
                    'stop here if there is nothing more to add.',
            }),
        }));
    },
};

function normalizeType(value: unknown): 'code' | 'document' | undefined {
    return value === 'code' || value === 'document' ? value : undefined;
}

// This backend doesn't enforce strict JSON-schema conformance on tool arguments — a model can
// (and in practice does) omit a field marked `required` in the schema, e.g. dropping `type`
// while still supplying `language`. Rather than treat that as invalid and drop otherwise-good
// content, infer `type` from whether a `language` was given: present → code, absent → document.
function resolveType(rawType: unknown, language: string | undefined): 'code' | 'document' {
    const normalized = normalizeType(rawType);
    if (normalized) {
        return normalized;
    }
    return language ? 'code' : 'document';
}

/**
 * Builds the live streaming-preview state from a `create_artifact` tool call's `arguments` while
 * they're still arriving as a raw, not-yet-valid-JSON string.
 */
export function parsePartialArtifactToolCall(rawArguments: string): StreamingArtifact {
    const { fields, partial } = parsePartialFlatJsonStringObject(rawArguments);
    const content = partial?.key === 'content' ? partial.value : (fields.content ?? '');
    const language = fields.language || undefined;

    return {
        id: fields.id || undefined,
        title: fields.title || undefined,
        // Only infer once a type-determining signal (explicit type, or language) has actually
        // streamed in — otherwise leave it undefined so the chip shows its "unknown yet" skeleton
        // instead of guessing "document" prematurely just because language hasn't arrived yet.
        type: normalizeType(fields.type) ?? (language ? 'code' : undefined),
        language,
        content,
        isComplete: false,
    };
}

/**
 * Builds the final artifact once the tool call's `arguments` have parsed as valid JSON.
 * Returns `null` only if a field with no reasonable fallback (title/content) is missing.
 */
export function parseCompleteArtifactToolCall(args: Record<string, unknown>): ParsedArtifact | null {
    const title = typeof args.title === 'string' ? args.title : undefined;
    const content = typeof args.content === 'string' ? args.content : undefined;

    if (!title || content === undefined) {
        return null;
    }

    const language = typeof args.language === 'string' && args.language ? args.language : undefined;
    const type = resolveType(args.type, language);
    const id = typeof args.id === 'string' && args.id ? args.id : hashArtifactIdentity(type, title, content);

    return {
        id,
        type,
        language: type === 'code' ? (language ?? 'text') : undefined,
        title,
        content,
    };
}

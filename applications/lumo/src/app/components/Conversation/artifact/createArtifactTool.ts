import type { ClientToolExecutor } from '@proton/lumo-api-client';

import type { ContentBlock } from '../../../types';
import { type ParsedArtifact, hashArtifactIdentity } from './parseArtifacts';

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
                    'letter, essay, or report is a "document" for this tool just as much as a script is. Do ' +
                    'NOT use it for short code snippets (1-2 lines) used to illustrate a point, brief ' +
                    'structured answers (a small table, a short list), or content that only makes sense as ' +
                    'part of your explanation — write those inline instead. To revise something you ' +
                    'already created earlier in this conversation, call this again with the exact same ' +
                    '`id` and the full updated content (never a diff or partial update); use a new `id` ' +
                    "only for a genuinely new, unrelated artifact. If the user's message references an " +
                    'artifact by its id, reuse that same id. Write a brief intro in your reply before ' +
                    'calling this.',
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

function isCreateArtifactToolCallBlock(block: ContentBlock): block is ContentBlock & { type: 'tool_call' } {
    if (block.type !== 'tool_call') {
        return false;
    }
    const parsed = block.toolCall as { name?: string } | undefined;
    return parsed?.name === CREATE_ARTIFACT_TOOL_NAME;
}

/**
 * Stable fingerprint of complete create_artifact tool calls in a message's blocks.
 * Ignores prose and other tool calls so artifact parsing doesn't re-run on every token.
 */
export function getCompleteArtifactBlocksKey(blocks: ContentBlock[]): string {
    const parts: string[] = [];

    for (const block of blocks) {
        if (!isCreateArtifactToolCallBlock(block)) {
            continue;
        }
        const parsed = block.toolCall as { arguments?: unknown } | undefined;
        if (!parsed?.arguments || typeof parsed.arguments !== 'object') {
            continue;
        }
        const args = parsed.arguments as Record<string, unknown>;
        const id = typeof args.id === 'string' ? args.id : '';
        const title = typeof args.title === 'string' ? args.title : '';
        const contentLen = typeof args.content === 'string' ? args.content.length : 0;
        parts.push(`${id}:${title}:${contentLen}`);
    }

    return parts.join('|');
}

/** Parses fully-formed create_artifact tool calls from structured message blocks. */
export function extractCompleteArtifactsFromBlocks(blocks: ContentBlock[]): ParsedArtifact[] {
    const complete = new Map<string, ParsedArtifact>();

    for (const block of blocks) {
        if (!isCreateArtifactToolCallBlock(block)) {
            continue;
        }
        const parsed = block.toolCall as { arguments?: unknown } | undefined;
        if (!parsed?.arguments || typeof parsed.arguments !== 'object') {
            continue;
        }
        const artifact = parseCompleteArtifactToolCall(parsed.arguments as Record<string, unknown>);
        if (artifact) {
            complete.set(artifact.id, artifact);
        }
    }

    return Array.from(complete.values());
}

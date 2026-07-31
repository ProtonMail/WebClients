import { getMessageBlocks } from '../../../messageHelpers';
import type { Message, MessageId } from '../../../types';
import { Role } from '../../../types-api';
import { CREATE_ARTIFACT_TOOL_NAME, parseCompleteArtifactToolCall } from './createArtifactTool';
import { type ParsedArtifact, parseArtifacts } from './parseArtifacts';

export interface ArtifactVersion {
    messageId: MessageId;
    content: string;
    language?: string;
    createdAt: string;
}

export interface ArtifactRegistryEntry {
    id: string;
    type: 'code' | 'document';
    title: string;
    language?: string;
    versions: ArtifactVersion[];
}

export type ArtifactRegistry = Record<string, ArtifactRegistryEntry>;

// Finalized (non-streaming) message content is immutable, so each message only ever needs
// to be parsed once regardless of how many times the registry is rebuilt.
const parseCache = new Map<MessageId, ParsedArtifact[]>();

// Legacy path: artifacts embedded as `<artifact>` tags in message.content (text-based protocol).
function getTagArtifacts(message: Message): ParsedArtifact[] {
    return parseArtifacts(message.content ?? '').artifacts;
}

// Current path: artifacts created via the create_artifact tool call, carried in message.blocks.
function getToolCallArtifacts(message: Message): ParsedArtifact[] {
    const artifacts: ParsedArtifact[] = [];
    for (const block of getMessageBlocks(message)) {
        if (block.type !== 'tool_call') {
            continue;
        }
        const parsed = block.toolCall as { name?: string; arguments?: unknown } | undefined;
        if (parsed?.name !== CREATE_ARTIFACT_TOOL_NAME || typeof parsed.arguments !== 'object' || !parsed.arguments) {
            continue;
        }
        const artifact = parseCompleteArtifactToolCall(parsed.arguments as Record<string, unknown>);
        if (artifact) {
            artifacts.push(artifact);
        }
    }
    return artifacts;
}

function getParsedArtifacts(message: Message): ParsedArtifact[] {
    const cached = parseCache.get(message.id);
    if (cached) {
        return cached;
    }
    const artifacts = [...getTagArtifacts(message), ...getToolCallArtifacts(message)];
    parseCache.set(message.id, artifacts);
    return artifacts;
}

/**
 * Walks a conversation's linear message chain and builds a registry of artifacts by id,
 * accumulating one version per finalized assistant message that reuses that id.
 */
export function buildArtifactRegistry(linearChain: Message[]): ArtifactRegistry {
    const registry: ArtifactRegistry = {};

    for (const message of linearChain) {
        // Note: no `!message.content` shortcut here — a message can carry an artifact via a
        // create_artifact tool-call block with no surrounding prose at all (empty `content`).
        if (message.role !== Role.Assistant || message.status === undefined) {
            continue;
        }

        for (const artifact of getParsedArtifacts(message)) {
            const entry = registry[artifact.id];
            const version: ArtifactVersion = {
                messageId: message.id,
                content: artifact.content,
                language: artifact.language,
                createdAt: message.createdAt,
            };

            if (entry) {
                entry.title = artifact.title;
                entry.type = artifact.type;
                entry.language = artifact.language;
                entry.versions.push(version);
            } else {
                registry[artifact.id] = {
                    id: artifact.id,
                    type: artifact.type,
                    title: artifact.title,
                    language: artifact.language,
                    versions: [version],
                };
            }
        }
    }

    return registry;
}

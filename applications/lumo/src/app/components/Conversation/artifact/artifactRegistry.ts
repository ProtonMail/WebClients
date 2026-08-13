import { getMessageBlocks } from '../../../messageHelpers';
import type { Message, MessageId } from '../../../types';
import { Role } from '../../../types-api';
import {
    CREATE_ARTIFACT_TOOL_NAME,
    getCompleteArtifactBlocksKey,
    parseCompleteArtifactToolCall,
} from './createArtifactTool';
import { type ArtifactType, type ParsedArtifact, parseArtifacts } from './parseArtifacts';

export interface ArtifactVersion {
    messageId: MessageId;
    content: string;
    language?: string;
    createdAt: string;
    /** True while the source message is still generating — promoted to finalized on message finish. */
    provisional?: boolean;
}

export interface ArtifactRegistryEntry {
    id: string;
    type: ArtifactType;
    title: string;
    language?: string;
    versions: ArtifactVersion[];
}

export type ArtifactRegistry = Record<string, ArtifactRegistryEntry>;

interface ParsedArtifactCacheEntry {
    fingerprint: string;
    artifacts: ParsedArtifact[];
}

// Finalized message content is immutable, so each message only needs to be parsed once
// after it settles — but in-flight messages must never be cached because tool-call blocks
// can appear mid-stream after an earlier parse returned nothing.
const parseCache = new Map<MessageId, ParsedArtifactCacheEntry>();

function getArtifactParseFingerprint(message: Message): string {
    return `${getCompleteArtifactBlocksKey(getMessageBlocks(message))}\0${message.content ?? ''}`;
}

// Legacy path: artifacts embedded as `<artifact>` tags in message.content (text-based protocol).
function getTagArtifacts(message: Message): ParsedArtifact[] {
    return parseArtifacts(message.content ?? '').artifacts;
}

// Current path: artifacts created via the create_artifact tool call, carried in message.blocks.
// Keyed by id: a single message can call create_artifact more than once for the same id (e.g. the
// model retrying/self-correcting within one reply) — that should collapse to one version for this
// message, not one version per call, or the panel's version history would show phantom
// intermediate attempts the user never actually saw settle.
function getToolCallArtifacts(message: Message): ParsedArtifact[] {
    const artifacts = new Map<string, ParsedArtifact>();
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
            artifacts.set(artifact.id, artifact);
        }
    }
    return Array.from(artifacts.values());
}

function getParsedArtifacts(message: Message): ParsedArtifact[] {
    const artifacts = [...getTagArtifacts(message), ...getToolCallArtifacts(message)];

    if (message.status === undefined) {
        return artifacts;
    }

    const fingerprint = getArtifactParseFingerprint(message);
    const cached = parseCache.get(message.id);
    if (cached?.fingerprint === fingerprint) {
        return cached.artifacts;
    }

    parseCache.set(message.id, { fingerprint, artifacts });
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

/** Returns the version index produced by `messageId`, or null if not registered yet. */
export function getArtifactVersionIndexForMessage(
    registry: ArtifactRegistry,
    artifactId: string,
    messageId: MessageId
): number | null {
    const entry = registry[artifactId];
    if (!entry) {
        return null;
    }
    const index = entry.versions.findIndex((version) => {
        return version.messageId === messageId;
    });
    if (index === -1) {
        return null;
    }
    return index;
}

function cloneRegistry(registry: ArtifactRegistry): ArtifactRegistry {
    const cloned: ArtifactRegistry = {};

    for (const [id, entry] of Object.entries(registry)) {
        cloned[id] = {
            ...entry,
            versions: entry.versions.map((version) => {
                return { ...version };
            }),
        };
    }

    return cloned;
}

/**
 * Stable fingerprint of complete create_artifact tool calls on in-flight assistant messages.
 * Used to recompute the provisional overlay only when a tool call lands or changes — not on every prose token.
 */
export function getInFlightArtifactFingerprint(linearChain: Message[]): string {
    const parts: string[] = [];

    for (const message of linearChain) {
        if (message.role !== Role.Assistant || message.status !== undefined) {
            continue;
        }
        const fingerprint = getCompleteArtifactBlocksKey(getMessageBlocks(message));
        if (fingerprint) {
            parts.push(`${message.id}:${fingerprint}`);
        }
    }

    return parts.join('|');
}

/**
 * Overlays provisional versions from in-flight assistant messages onto a finalized registry.
 * Provisional versions are replaced in-place when the same messageId is seen again; they
 * drop automatically once the message finalizes (and is picked up by `buildArtifactRegistry`).
 */
export function mergeProvisionalArtifactRegistry(
    finalizedRegistry: ArtifactRegistry,
    linearChain: Message[]
): ArtifactRegistry {
    const merged = cloneRegistry(finalizedRegistry);

    for (const message of linearChain) {
        if (message.role !== Role.Assistant || message.status !== undefined) {
            continue;
        }

        for (const artifact of getParsedArtifacts(message)) {
            const version: ArtifactVersion = {
                messageId: message.id,
                content: artifact.content,
                language: artifact.language,
                createdAt: message.createdAt,
                provisional: true,
            };

            const existingEntry = merged[artifact.id];
            if (existingEntry) {
                const existingIndex = existingEntry.versions.findIndex((entry) => {
                    return entry.messageId === message.id;
                });
                existingEntry.title = artifact.title;
                existingEntry.type = artifact.type;
                existingEntry.language = artifact.language;
                if (existingIndex === -1) {
                    existingEntry.versions.push(version);
                } else {
                    existingEntry.versions[existingIndex] = version;
                }
            } else {
                merged[artifact.id] = {
                    id: artifact.id,
                    type: artifact.type,
                    title: artifact.title,
                    language: artifact.language,
                    versions: [version],
                };
            }
        }
    }

    return merged;
}

export function isArtifactVersionProvisional(
    registry: ArtifactRegistry,
    artifactId: string,
    versionIndex: number
): boolean {
    const version = registry[artifactId]?.versions[versionIndex];
    if (!version) {
        return false;
    }
    return version.provisional === true;
}

import type { Message, MessageId } from '../../../types';
import { Role } from '../../../types-api';
import { parseArtifacts } from './parseArtifacts';

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
// to be regex-parsed once regardless of how many times the registry is rebuilt.
const parseCache = new Map<MessageId, ReturnType<typeof parseArtifacts>['artifacts']>();

function getParsedArtifacts(message: Message): ReturnType<typeof parseArtifacts>['artifacts'] {
    const cached = parseCache.get(message.id);
    if (cached) {
        return cached;
    }
    const { artifacts } = parseArtifacts(message.content ?? '');
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
        if (message.role !== Role.Assistant || message.status === undefined || !message.content) {
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

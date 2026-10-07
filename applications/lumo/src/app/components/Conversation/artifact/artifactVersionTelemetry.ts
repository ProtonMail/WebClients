import { hasArtifactAction } from '../../../messageHelpers';
import type { Message, MessageId } from '../../../types';
import { isManualArtifactEditMessage } from '../../../types';
import { Role } from '../../../types-api';
import {
    type ArtifactCreatedEventPayload,
    type ArtifactRevisedEventPayload,
    type ArtifactRevisionSource,
    bucketArtifactContentLength,
    bucketArtifactLanguage,
    capArtifactPosition,
} from '../../../util/telemetry';
import type { ArtifactToolMode } from '../helper';
import type { ArtifactRegistry } from './artifactRegistry';

/**
 * Messages that can produce an artifact version *in this tab*: assistant messages this client
 * started generating, and manual edits the user saved here. The registry is re-derived from the
 * message chain on every conversation load and branch switch, so without this allowlist every
 * historical artifact would be reported as newly created each time a conversation is opened.
 *
 * Entries are consumed once their message finalizes, which also dedupes branch switches (a
 * version already reported is never reported again). Module-level so it survives the panel
 * unmounting mid-generation; capped so abandoned generations can't grow it unboundedly.
 */
export interface LiveArtifactMessage {
    // Undefined for manual edits, which don't go through the model.
    artifactToolMode?: ArtifactToolMode;
}

const MAX_LIVE_MESSAGES = 50;

const liveArtifactMessages = new Map<MessageId, LiveArtifactMessage>();

export function markArtifactTelemetryLiveMessage(messageId: MessageId, info: LiveArtifactMessage = {}) {
    liveArtifactMessages.delete(messageId);
    liveArtifactMessages.set(messageId, info);

    if (liveArtifactMessages.size > MAX_LIVE_MESSAGES) {
        const oldest = liveArtifactMessages.keys().next().value;
        if (oldest !== undefined) {
            liveArtifactMessages.delete(oldest);
        }
    }
}

export function getArtifactTelemetryLiveMessages(): ReadonlyMap<MessageId, LiveArtifactMessage> {
    return liveArtifactMessages;
}

export function consumeArtifactTelemetryLiveMessages(messageIds: MessageId[]) {
    for (const messageId of messageIds) {
        liveArtifactMessages.delete(messageId);
    }
}

export function resolveArtifactRevisionSource(
    linearChain: Message[],
    versionMessageId: MessageId
): ArtifactRevisionSource | null {
    const message = linearChain.find((entry) => {
        return entry.id === versionMessageId;
    });

    if (!message) {
        return null;
    }

    if (isManualArtifactEditMessage(message)) {
        return 'manual-edit';
    }

    if (message.role !== Role.Assistant) {
        return null;
    }

    if (!message.parentId) {
        return 'prompt';
    }

    const parent = linearChain.find((entry) => {
        return entry.id === message.parentId;
    });

    if (parent && hasArtifactAction(parent)) {
        return 'inline-edit';
    }

    return 'prompt';
}

// Same definition of "finalized" as `useArtifactRegistry`, so a message is consumed exactly when
// its versions stop being provisional.
function isFinalizedMessage(message: Message): boolean {
    return isManualArtifactEditMessage(message) || (message.role === Role.Assistant && message.status !== undefined);
}

export type ArtifactVersionTelemetryEvent =
    | { kind: 'created'; payload: ArtifactCreatedEventPayload }
    | { kind: 'revised'; payload: ArtifactRevisedEventPayload };

/**
 * Pure core of artifact creation/revision telemetry: which finalized versions on the active chain
 * came from a live message (and so haven't been reported yet), and which live messages are done.
 */
export function collectArtifactVersionTelemetry(
    registry: ArtifactRegistry,
    linearChain: Message[],
    liveMessages: ReadonlyMap<MessageId, LiveArtifactMessage>
): { events: ArtifactVersionTelemetryEvent[]; consumedMessageIds: MessageId[] } {
    if (liveMessages.size === 0) {
        return { events: [], consumedMessageIds: [] };
    }

    const events: ArtifactVersionTelemetryEvent[] = [];

    // Registry keys are inserted in chain order of first appearance, so this is the artifact's
    // ordinal within the conversation — a stand-in for a per-artifact id, which we don't send.
    Object.values(registry).forEach((entry, entryIndex) => {
        entry.versions.forEach((version, versionIndex) => {
            if (version.provisional) {
                return;
            }

            const live = liveMessages.get(version.messageId);
            if (!live) {
                return;
            }

            const common = {
                artifactType: entry.type,
                artifactToolMode: live.artifactToolMode,
                artifactPosition: capArtifactPosition(entryIndex + 1),
                contentLengthBucket: bucketArtifactContentLength(version.content.length),
            };

            if (versionIndex === 0) {
                events.push({
                    kind: 'created',
                    payload: {
                        ...common,
                        languageBucket:
                            entry.type === 'code'
                                ? bucketArtifactLanguage(version.language ?? entry.language)
                                : undefined,
                    },
                });
                return;
            }

            events.push({
                kind: 'revised',
                payload: {
                    ...common,
                    revisionSource: resolveArtifactRevisionSource(linearChain, version.messageId) ?? 'prompt',
                    versionNumber: versionIndex + 1,
                },
            });
        });
    });

    const consumedMessageIds: MessageId[] = [];
    for (const messageId of liveMessages.keys()) {
        const message = linearChain.find((entry) => {
            return entry.id === messageId;
        });
        if (message && isFinalizedMessage(message)) {
            consumedMessageIds.push(messageId);
        }
    }

    return { events, consumedMessageIds };
}

import { getMessageBlocks, hasArtifactAction } from '../../../messageHelpers';
import type { Message, MessageId } from '../../../types';
import { isManualArtifactEditMessage } from '../../../types';
import { Role } from '../../../types-api';
import {
    type ArtifactCreatedEventPayload,
    type ArtifactRevisedEventPayload,
    type ArtifactRevisionSource,
    type ArtifactToolCallInvalidEventPayload,
    type ArtifactToolCallInvalidReason,
    bucketArtifactContentLength,
    bucketArtifactLanguage,
    capArtifactPosition,
} from '../../../util/telemetry';
import type { ArtifactToolMode } from '../helper';
import type { ArtifactRegistry } from './artifactRegistry';
import { CREATE_ARTIFACT_TOOL_NAME, parseCompleteArtifactToolCall } from './createArtifactTool';

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
    // The user stopped the response. A stopped message still finishes as `succeeded`, so this is
    // what keeps a create_artifact call cut off mid-stream from being reported as invalid.
    stopped?: boolean;
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

export function markArtifactTelemetryLiveMessageStopped(messageId: MessageId) {
    const live = liveArtifactMessages.get(messageId);
    if (live) {
        liveArtifactMessages.set(messageId, { ...live, stopped: true });
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
    | { kind: 'revised'; payload: ArtifactRevisedEventPayload }
    | { kind: 'invalid'; payload: ArtifactToolCallInvalidEventPayload };

// When the call's JSON didn't parse, its name can only be found in the raw string.
const CREATE_ARTIFACT_NAME_PATTERN = new RegExp(`"name"\\s*:\\s*"${CREATE_ARTIFACT_TOOL_NAME}"`);

/** Why each create_artifact call in the message produced no creation, and whether any call did. */
function inspectArtifactToolCalls(message: Message): {
    invalidReasons: ArtifactToolCallInvalidReason[];
    hasValidCall: boolean;
} {
    const invalidReasons: ArtifactToolCallInvalidReason[] = [];
    let hasValidCall = false;

    for (const block of getMessageBlocks(message)) {
        if (block.type !== 'tool_call') {
            continue;
        }

        const parsed = block.toolCall as { name?: string; arguments?: unknown } | undefined;
        if (!parsed || typeof parsed !== 'object') {
            if (CREATE_ARTIFACT_NAME_PATTERN.test(block.content)) {
                invalidReasons.push('invalid-json');
            }
            continue;
        }
        if (parsed.name !== CREATE_ARTIFACT_TOOL_NAME) {
            continue;
        }

        const args = parsed.arguments;
        if (typeof args === 'object' && args && parseCompleteArtifactToolCall(args as Record<string, unknown>)) {
            hasValidCall = true;
        } else {
            invalidReasons.push('missing-fields');
        }
    }

    return { invalidReasons, hasValidCall };
}

/**
 * Pure core of artifact creation/revision telemetry: which finalized versions on the active chain
 * came from a live message (and so haven't been reported yet), and which live messages are done.
 */
/** The artifact version the panel is showing, if open; used to flag revisions requested from an older version. */
export interface ViewedArtifactVersion {
    artifactId: string;
    versionIndex: number;
}

export function collectArtifactVersionTelemetry(
    registry: ArtifactRegistry,
    linearChain: Message[],
    liveMessages: ReadonlyMap<MessageId, LiveArtifactMessage>,
    viewedVersion: ViewedArtifactVersion | null = null
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
                    // The panel doesn't follow a new version while an older one is shown, so at
                    // this point it still shows what the user was looking at when they asked.
                    viewedOlderVersion:
                        viewedVersion?.artifactId === entry.id && viewedVersion.versionIndex < versionIndex - 1,
                },
            });
        });
    });

    const consumedMessageIds: MessageId[] = [];
    for (const [messageId, live] of liveMessages) {
        const message = linearChain.find((entry) => {
            return entry.id === messageId;
        });
        if (!message || !isFinalizedMessage(message)) {
            continue;
        }
        consumedMessageIds.push(messageId);

        // Stopped or failed responses can end mid-call; only a finished response's calls count.
        if (message.role !== Role.Assistant || message.status !== 'succeeded' || live.stopped) {
            continue;
        }
        const { invalidReasons, hasValidCall } = inspectArtifactToolCalls(message);
        for (const reason of invalidReasons) {
            events.push({
                kind: 'invalid',
                payload: {
                    reason,
                    artifactToolMode: live.artifactToolMode,
                    recoveredInSameMessage: hasValidCall,
                },
            });
        }
    }

    return { events, consumedMessageIds };
}

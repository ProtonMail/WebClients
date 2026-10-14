import { useEffect, useMemo, useRef, useState } from 'react';

import { useConnectionState, useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import type { Room, TextStreamReader } from 'livekit-client';

import { logger } from '@proton/logger';
import { useMeetErrorReporting } from '@proton/meet';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectCaptionsAgentPresent } from '@proton/meet/store/slices/participants/agentParticipantsSlice';
import { binaryStringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { isCaptionsSimSegmentId, subscribeCaptionsSimEvents, useCaptionsSimStatus } from '../../dev/captionsSimStore';
import { useStableCallback } from '../../hooks/useStableCallback';
import { isCaptionAgent } from '../../utils/getAgentDisplayInfo';

const TRANSCRIPTION_TOPIC = 'lk.transcription';
const FINAL_LINGER_MS = 4000;
const STALE_SEGMENT_MS = 15000;
// How many lines are kept on screen to scroll back through; older ones expire.
const MAX_VISIBLE = 6;
// Gap between two same-speaker segments below which we treat the split as a breath and merge them.
export const MERGE_GAP_MS = 1500;
// How long to wait for a first usable line before calling the agent stuck.
export const READY_TIMEOUT_MS = 20000;

export interface CaptionSegment {
    id: string;
    text: string;
    speakerIdentity: string;
    isFinal: boolean;
    // When the segment first appeared. Unlike receivedAt, interim updates don't move it.
    firstSeenAt: number;
    receivedAt: number;
}

// 'failing' means captions are arriving but none can be decoded. 'disconnected' means they can't
// arrive until we, or the agent, are back in the room.
export type CaptionsStatus = 'loading' | 'ready' | 'active' | 'failing' | 'disconnected';

export interface Transcriptions {
    segments: CaptionSegment[];
    status: CaptionsStatus;
}

// Rooms that already have a transcription consumer, so a second concurrent mount doesn't clobber
// the shared handler.
const roomsWithConsumer = new WeakSet<Room>();

const emptyDiagnostics = () => ({ streamsReceived: 0, streamReadFailures: 0, decryptFailures: 0 });

const upsertSegment = (
    prev: Map<string, CaptionSegment>,
    update: Pick<CaptionSegment, 'id' | 'text' | 'speakerIdentity' | 'isFinal'>
) => {
    const next = new Map(prev);
    const now = Date.now();
    next.set(update.id, { ...update, firstSeenAt: prev.get(update.id)?.firstSeenAt ?? now, receivedAt: now });
    return next;
};

export const useTranscriptions = (): Transcriptions => {
    const room = useRoomContext();
    const meetCoreClient = useMeetCoreClient();
    const { reportMeetError } = useMeetErrorReporting();
    const agentPresent = useMeetSelector(selectCaptionsAgentPresent);
    const connectionState = useConnectionState(room);
    const simStatus = useCaptionsSimStatus();
    // An agent that has yet to join is still loading; one that has left took the captions with it.
    const agentEverPresent = useRef(false);
    agentEverPresent.current = agentEverPresent.current || agentPresent;
    const [segments, setSegments] = useState<Map<string, CaptionSegment>>(() => new Map());
    // Ids of the raw segments composing the currently-visible lines; these are kept alive so the
    // last lines stay on screen instead of being expired by the cleanup interval below.
    const visibleIdsRef = useRef<Set<string>>(new Set());
    const diagnostics = useRef(emptyDiagnostics());
    const [listening, setListening] = useState(false);
    const [failing, setFailing] = useState(false);

    // Stable, so a change of the error reporting flag can't tear down and re-register the consumer.
    const reportError = useStableCallback(reportMeetError);

    // Runs from a timer, so it sees the segments of whichever render it fires in.
    const reportStalledFeed = useStableCallback(() => {
        if (segments.size > 0) {
            return;
        }

        const { streamsReceived, streamReadFailures, decryptFailures } = diagnostics.current;

        // No streams at all is indistinguishable from a quiet room, so only undecodable ones are
        // treated as a fault.
        if (streamsReceived === 0) {
            reportError('Captions agent published no transcriptions', {
                level: 'warning',
                context: { waitedMs: READY_TIMEOUT_MS },
            });
            return;
        }

        setFailing(true);
        reportError('Captions received but none could be decoded', {
            context: { streamsReceived, streamReadFailures, decryptFailures },
        });
    });

    useEffect(() => {
        if (!room || !meetCoreClient) {
            return;
        }

        if (roomsWithConsumer.has(room)) {
            logger.error('useTranscriptions is mounted more than once; only a single consumer is supported per room.');
            return;
        }

        // An unmatched track is left unlabelled rather than attributed to the agent.
        const resolveSpeakerIdentity = (attributes: Record<string, string> | undefined): string => {
            const trackSid = attributes?.['lk.transcribed_track_id'];
            if (!trackSid) {
                return '';
            }
            const participants = [room.localParticipant, ...room.remoteParticipants.values()];
            const speaker = participants.find((participant) =>
                [...participant.trackPublications.values()].some((publication) => publication.trackSid === trackSid)
            );
            return speaker?.identity ?? '';
        };

        // Any participant can publish on this topic and encrypt with the group key.
        const isCaptionAgentSender = (identity?: string): boolean => {
            if (!identity) {
                return false;
            }
            const sender = room.remoteParticipants.get(identity);
            return Boolean(sender && isCaptionAgent(sender));
        };

        const handler = async (reader: TextStreamReader, info: { identity?: string }) => {
            if (!isCaptionAgentSender(info.identity)) {
                return;
            }

            diagnostics.current.streamsReceived += 1;

            const id =
                reader.info?.attributes?.['lk.segment_id'] ??
                reader.info?.id ??
                `${info.identity ?? 'unknown'}-${Date.now()}`;
            const isFinal = reader.info?.attributes?.['lk.transcription_final'] === 'true';
            const speakerIdentity = resolveSpeakerIdentity(reader.info?.attributes);

            let payload = '';
            try {
                for await (const chunk of reader) {
                    payload += chunk;
                }
            } catch (error) {
                diagnostics.current.streamReadFailures += 1;
                reportError('Failed to read a transcription stream', error);
                return;
            }

            let decrypted;
            try {
                decrypted = await meetCoreClient.decryptMessage(binaryStringToUint8Array(atob(payload)));
            } catch (error) {
                diagnostics.current.decryptFailures += 1;
                reportError('Failed to decrypt a transcription', error);
                return;
            }

            // A failed decryption can resolve without throwing, and reading the text below happens
            // inside a state updater, where it would take the captions down with it.
            if (!decrypted?.message) {
                diagnostics.current.decryptFailures += 1;
                reportError('Decrypted a transcription with no text');
                return;
            }

            setSegments((prev) => upsertSegment(prev, { id, text: decrypted.message, speakerIdentity, isFinal }));
        };

        try {
            room.registerTextStreamHandler(TRANSCRIPTION_TOPIC, handler);
        } catch (error) {
            logger.error('Failed to register the transcription handler', error);
            return;
        }
        roomsWithConsumer.add(room);

        // Per-room state, so a rejoin starts from nothing.
        diagnostics.current = emptyDiagnostics();
        visibleIdsRef.current = new Set();
        setSegments(new Map());
        setListening(true);

        return () => {
            setListening(false);
            roomsWithConsumer.delete(room);
            room.unregisterTextStreamHandler(TRANSCRIPTION_TOPIC);
        };
    }, [room, meetCoreClient, reportError]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        return subscribeCaptionsSimEvents((event) => {
            if (event.type === 'segment') {
                setSegments((prev) => upsertSegment(prev, event.segment));
                return;
            }
            setSegments((prev) => new Map([...prev].filter(([id]) => !isCaptionsSimSegmentId(id))));
        });
    }, []);

    // Only a listening consumer with an agent to listen to can blame the agent for the silence.
    useEffect(() => {
        if (!listening || !agentPresent) {
            return;
        }
        const timeout = setTimeout(reportStalledFeed, READY_TIMEOUT_MS);
        return () => clearTimeout(timeout);
    }, [listening, agentPresent, reportStalledFeed]);

    const hasSegments = segments.size > 0;
    useEffect(() => {
        if (!hasSegments) {
            return;
        }
        const interval = setInterval(() => {
            const now = Date.now();
            setSegments((prev) => {
                let mutated = false;
                const next = new Map(prev);
                for (const [id, seg] of prev) {
                    if (visibleIdsRef.current.has(id)) {
                        // Keep the last visible lines on screen regardless of age.
                        continue;
                    }
                    const age = now - seg.receivedAt;
                    const expired = seg.isFinal ? age > FINAL_LINGER_MS : age > STALE_SEGMENT_MS;
                    if (expired) {
                        next.delete(id);
                        mutated = true;
                    }
                }
                return mutated ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [hasSegments]);

    const { visibleSegments, visibleIds } = useMemo(() => {
        const sorted = Array.from(segments.values()).sort((a, b) => a.firstSeenAt - b.firstSeenAt);

        // Merge consecutive segments from the same speaker into one line, so a short pause (e.g. a
        // breath) that makes the STT emit two segments still reads as a single line. The merged line
        // keeps the group's first id as a stable React key; the growing text re-triggers the cursor.
        const merged: { line: CaptionSegment; memberIds: string[] }[] = [];
        for (const seg of sorted) {
            const last = merged[merged.length - 1];
            // An unattributed segment could be anyone, so it never counts as the same speaker.
            const sameSpeaker = Boolean(seg.speakerIdentity) && last?.line.speakerIdentity === seg.speakerIdentity;
            // Gap between the previous line's last update and this segment's first, so a segment
            // that keeps updating can't grow its own gap and split a line that already merged.
            const withinBreath = last && seg.firstSeenAt - last.line.receivedAt <= MERGE_GAP_MS;
            if (last && sameSpeaker && withinBreath) {
                last.line = {
                    ...last.line,
                    text: `${last.line.text} ${seg.text}`.trim(),
                    isFinal: seg.isFinal,
                    receivedAt: seg.receivedAt,
                };
                last.memberIds.push(seg.id);
            } else {
                merged.push({ line: seg, memberIds: [seg.id] });
            }
        }

        const visibleGroups = merged.slice(-MAX_VISIBLE);

        return {
            visibleSegments: visibleGroups.map((group) => group.line),
            visibleIds: new Set(visibleGroups.flatMap((group) => group.memberIds)),
        };
    }, [segments]);

    // Assigned during render rather than from an effect, so the cleanup interval can never expire a
    // segment that is already on screen in the render it fires between.
    visibleIdsRef.current = visibleIds;

    // LiveKit also resumes through SignalReconnecting when the peer connection itself failed.
    const disconnected =
        connectionState === ConnectionState.SignalReconnecting ||
        connectionState === ConnectionState.Reconnecting ||
        (agentEverPresent.current && !agentPresent) ||
        simStatus === 'disconnected';

    let status: CaptionsStatus = 'loading';
    // Lines already on screen would otherwise sit there looking current.
    if (disconnected) {
        status = 'disconnected';
    } else if (hasSegments) {
        status = 'active';
    } else if (failing || simStatus === 'failing') {
        status = 'failing';
    } else if ((listening && agentPresent) || simStatus === 'ready') {
        status = 'ready';
    }

    return { segments: visibleSegments, status };
};

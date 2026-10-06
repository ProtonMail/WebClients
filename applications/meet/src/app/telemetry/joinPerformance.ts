import type { RemoteTrack, Room } from 'livekit-client';
import { RoomEvent, Track, TrackEvent } from 'livekit-client';

import { getParticipantCountBucket } from '@proton/meet/telemetry/buckets';
import type {
    IceTransport,
    JoinSource,
    MeetPerformanceValues,
    MeetingTypeDimension,
} from '@proton/meet/telemetry/events';
import {
    TelemetryMeetPerformanceEvents,
    isMeetTelemetryEnabled,
    sendMeetPerformanceEvent,
} from '@proton/meet/telemetry/meetTelemetry';
import { SECOND } from '@proton/shared/lib/constants';

import type { IceCandidateInfo } from '../utils/checkIfUsingTurnRelay';

const FIRST_REMOTE_MEDIA_TIMEOUT_MS = 30 * SECOND;

type JoinValues = MeetPerformanceValues[TelemetryMeetPerformanceEvents.join_succeeded];

type JoinTimerPhase = 'srpMs' | 'meetingInfoMs';

export interface JoinTimer {
    /** performance.now() at the Join click. */
    start: number;
    phases: Partial<Record<JoinTimerPhase, number>>;
    measure: <T>(phase: JoinTimerPhase, promise: Promise<T>) => Promise<T>;
}

/** Started at the Join click, times the steps of the join that happen before the connection. */
export const createJoinTimer = (): JoinTimer => {
    const phases: JoinTimer['phases'] = {};

    return {
        start: performance.now(),
        phases,
        measure: async (phase, promise) => {
            const start = performance.now();
            const result = await promise;
            phases[phase] = performance.now() - start;
            return result;
        },
    };
};

const getIceTransport = ({ localCandidateType }: IceCandidateInfo): IceTransport => {
    switch (localCandidateType) {
        case 'host':
            return 'direct';
        case 'srflx':
        case 'prflx':
            return 'stun';
        case 'relay':
            return 'turn_relay';
        default:
            return 'n/a';
    }
};

const getPublishedKinds = (room: Room) => {
    const publications = [...room.remoteParticipants.values()].flatMap((participant) => [
        ...participant.trackPublications.values(),
    ]);

    return {
        hasAudio: publications.some((publication) => publication.kind === Track.Kind.Audio && !publication.isMuted),
        hasVideo: publications.some((publication) => publication.kind === Track.Kind.Video && !publication.isMuted),
    };
};

/** Resolves once the media of the track flows, which for audio means it can be heard. */
const onAudioFlowing = (track: RemoteTrack, callback: () => void) => {
    const mediaStreamTrack = track.mediaStreamTrack;

    if (!mediaStreamTrack.muted) {
        callback();
        return () => {};
    }

    mediaStreamTrack.addEventListener('unmute', callback, { once: true });
    return () => mediaStreamTrack.removeEventListener('unmute', callback);
};

/** Resolves once a frame of the track is presented in one of the elements it is attached to. */
const onFirstVideoFrame = (track: RemoteTrack, callback: () => void) => {
    const cleanups: (() => void)[] = [];

    const watchElement = (element: HTMLMediaElement) => {
        if (element instanceof HTMLVideoElement && 'requestVideoFrameCallback' in element) {
            const handle = element.requestVideoFrameCallback(() => callback());
            cleanups.push(() => element.cancelVideoFrameCallback(handle));
            return;
        }

        if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            callback();
            return;
        }

        element.addEventListener('loadeddata', callback, { once: true });
        cleanups.push(() => element.removeEventListener('loadeddata', callback));
    };

    track.attachedElements.forEach(watchElement);
    track.on(TrackEvent.ElementAttached, watchElement);
    cleanups.push(() => track.off(TrackEvent.ElementAttached, watchElement));

    return () => cleanups.forEach((cleanup) => cleanup());
};

interface TrackJoinSucceededParams {
    room: Room;
    joinTimer: JoinTimer;
    connectedAt: number;
    joinSource: JoinSource;
    meetingType: MeetingTypeDimension;
    connectPhases: Omit<JoinValues, JoinTimerPhase | 'firstRemoteAudioMs' | 'firstRemoteVideoMs' | 'totalJoinMs'>;
    getIceCandidateInfo: () => Promise<IceCandidateInfo>;
}

/**
 * Sends join_succeeded once the first remote audio and video are out, or right away when nobody
 * publishes any. The event is dropped when the room disconnects before that.
 */
export const trackJoinSucceeded = ({
    room,
    joinTimer,
    connectedAt,
    joinSource,
    meetingType,
    connectPhases,
    getIceCandidateInfo,
}: TrackJoinSucceededParams) => {
    if (!isMeetTelemetryEnabled()) {
        return;
    }

    const { start: joinStart } = joinTimer;
    const { hasAudio, hasVideo } = getPublishedKinds(room);

    let firstRemoteAudio: number | undefined;
    let firstRemoteVideo: number | undefined;
    let done = false;
    const cleanups: (() => void)[] = [];

    const cleanup = () => {
        done = true;
        cleanups.splice(0).forEach((fn) => fn());
    };

    // The event can already be sent while the listeners are being set up
    const addCleanup = (fn: () => void) => {
        if (done) {
            fn();
        } else {
            cleanups.push(fn);
        }
    };

    const send = async () => {
        if (done) {
            return;
        }
        cleanup();

        const firstMedia = Math.min(firstRemoteAudio ?? Infinity, firstRemoteVideo ?? Infinity);
        const participantCount = room.remoteParticipants.size + 1;
        const iceCandidateInfo = await getIceCandidateInfo().catch((): IceCandidateInfo => ({}));

        sendMeetPerformanceEvent(
            TelemetryMeetPerformanceEvents.join_succeeded,
            {
                joinSource,
                meetingType,
                iceTransport: getIceTransport(iceCandidateInfo),
                participantCountBucket: getParticipantCountBucket(participantCount),
            },
            {
                ...joinTimer.phases,
                ...connectPhases,
                firstRemoteAudioMs: firstRemoteAudio !== undefined ? firstRemoteAudio - joinStart : undefined,
                firstRemoteVideoMs: firstRemoteVideo !== undefined ? firstRemoteVideo - joinStart : undefined,
                totalJoinMs: (Number.isFinite(firstMedia) ? firstMedia : connectedAt) - joinStart,
            }
        );
    };

    if (!hasAudio && !hasVideo) {
        void send();
        return;
    }

    const maybeSend = () => {
        if ((!hasAudio || firstRemoteAudio !== undefined) && (!hasVideo || firstRemoteVideo !== undefined)) {
            void send();
        }
    };

    const watchTrack = (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio && hasAudio && firstRemoteAudio === undefined) {
            addCleanup(
                onAudioFlowing(track, () => {
                    firstRemoteAudio ??= performance.now();
                    maybeSend();
                })
            );
        }

        if (track.kind === Track.Kind.Video && hasVideo && firstRemoteVideo === undefined) {
            addCleanup(
                onFirstVideoFrame(track, () => {
                    firstRemoteVideo ??= performance.now();
                    maybeSend();
                })
            );
        }
    };

    const handleTrackSubscribed = (track: RemoteTrack) => watchTrack(track);

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.Disconnected, cleanup);
    addCleanup(() => {
        room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.off(RoomEvent.Disconnected, cleanup);
    });

    const timeout = setTimeout(send, FIRST_REMOTE_MEDIA_TIMEOUT_MS);
    addCleanup(() => clearTimeout(timeout));

    room.remoteParticipants.forEach((participant) =>
        participant.trackPublications.forEach((publication) => {
            if (publication.track) {
                watchTrack(publication.track);
            }
        })
    );
};

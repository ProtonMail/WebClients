import type { Participant, TrackPublication } from 'livekit-client';
import {
    ConnectionState,
    type RemoteParticipant,
    type RemoteTrackPublication,
    type Room,
    RoomEvent,
    Track,
} from 'livekit-client';

import { isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { AudioRecoveryAPI } from '../e2eeRecovery/E2eeRecoveryManager';
import type { RecoveryReason, ReportError } from '../e2eeRecovery/types';

interface PublicationItem {
    publication: RemoteTrackPublication;
    participant: RemoteParticipant;
}

export const sortAudioPublications = <T extends PublicationItem>(publications: T[]): T[] => {
    return publications.sort((a, b) => {
        if (!a.publication) {
            return 1;
        }

        if (!b.publication) {
            return -1;
        }

        if (a.publication.isMuted !== b.publication.isMuted) {
            return a.publication.isMuted ? 1 : -1;
        }

        return (b?.participant?.lastSpokeAt?.getTime() ?? 0) - (a?.participant?.lastSpokeAt?.getTime() ?? 0);
    });
};

const trackKeyOf = (participant: { sid: string }, publication: { trackSid: string }) =>
    `${participant.sid}-${publication.trackSid}`;

/**
 * Owns the cap of N concurrently subscribed remote microphone publications,
 * sorting/eviction logic and unmute/active-speaker driven (re)subscriptions.
 *
 * Detection of broken cryptors, missing stats, concealment, persistent
 * noise etc. lives in `E2eeRecoveryManager`; this class only exposes the
 * recovery *primitive* (an unsubscribe → wait → resubscribe → enable
 * dance) via {@link AudioRecoveryAPI} so the recovery manager can drive it
 * without duplicating the cache / event-guard coordination it already does.
 */
export class AudioTrackSubscriptionManager implements AudioRecoveryAPI {
    private microphoneCapacity: number;
    private room: Room;
    private reportError?: ReportError;
    private subscribedMicrophoneTrackPublications: Map<string, PublicationItem> = new Map();
    private lastSortingResult: PublicationItem[] = [];
    private reconcileInterval: NodeJS.Timeout | null = null;
    private activeRecoveries = new Set<string>();
    private recoveryTimeouts = new Map<string, NodeJS.Timeout>();

    // How long we keep `activeRecoveries` entry around after the dance
    // completes, so subscription event handlers (handleAudioTrackPublished,
    // handleTrackUnmuted, handleActiveSpeakerChanged, reconcileAudioTracks)
    // don't race with the just-resubscribed transceiver and tear it down
    // before it has produced its first packets.
    private RECOVERY_COOLDOWN = 3_000;

    constructor(capacity: number, room: Room, reportError?: ReportError) {
        this.microphoneCapacity = capacity;
        this.room = room;
        this.reportError = reportError;
    }

    addToCache(publication: RemoteTrackPublication, participant: RemoteParticipant) {
        this.subscribedMicrophoneTrackPublications.set(publication.trackSid, {
            participant,
            publication,
        });
    }

    handleCacheUpdate(pub: RemoteTrackPublication, participant: RemoteParticipant) {
        this.addToCache(pub, participant);

        const cache = this.subscribedMicrophoneTrackPublications;

        if (cache.size <= this.microphoneCapacity) {
            return;
        }

        const sortedCache = sortAudioPublications(Array.from(cache.values()));

        this.lastSortingResult = sortedCache;

        const tracksToUnsubscribe = sortedCache.slice(this.microphoneCapacity);

        tracksToUnsubscribe.forEach((track) => {
            track.publication.setSubscribed(false);
            cache.delete(track.publication.trackSid);
        });
    }

    getMicrophoneAudioPublications = () => {
        const microphoneAudioPublications: PublicationItem[] = [];

        for (const participant of this.room.remoteParticipants.values()) {
            if (participant.identity === this.room.localParticipant.identity) {
                continue;
            }

            for (const publication of participant.audioTrackPublications.values()) {
                const pub = publication as RemoteTrackPublication;

                if (pub.source === Track.Source.Microphone) {
                    microphoneAudioPublications.push({ publication: pub, participant });
                }
            }
        }

        return microphoneAudioPublications;
    };

    handleRoomConnected = () => {
        const microphoneAudioPublications: PublicationItem[] = [];

        for (const participant of this.room.remoteParticipants.values()) {
            if (participant.identity === this.room.localParticipant.identity) {
                continue;
            }

            for (const publication of participant.audioTrackPublications.values()) {
                const pub = publication as RemoteTrackPublication;

                if (pub.source === Track.Source.ScreenShareAudio) {
                    pub.setSubscribed(true);
                    pub.setEnabled(true);
                }

                if (pub.source === Track.Source.Microphone) {
                    microphoneAudioPublications.push({ publication: pub, participant });
                }
            }
        }

        const sortedMicrophoneAudioPublications = sortAudioPublications(microphoneAudioPublications);

        const publicationsToRegister = sortedMicrophoneAudioPublications.slice(0, this.microphoneCapacity);

        for (const publication of publicationsToRegister) {
            if (!publication.publication.isSubscribed) {
                publication.publication.setSubscribed(true);
                publication.publication.setEnabled(true);
            }

            this.handleCacheUpdate(publication.publication, publication.participant);
        }
    };

    handleAudioTrackPublished = (pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (participant.identity === this.room.localParticipant.identity) {
            return;
        }

        if (pub.source === Track.Source.ScreenShareAudio) {
            pub.setSubscribed(true);
            pub.setEnabled(true);
            return;
        }

        if (pub.source === Track.Source.Microphone && !pub.isSubscribed) {
            const trackKey = trackKeyOf(participant, pub);

            if (this.activeRecoveries.has(trackKey)) {
                // eslint-disable-next-line no-console
                console.log('Skipping handleAudioTrackPublished, recovery in progress for trackKey:', trackKey);
                return;
            }

            // If the cache is already full, prevent adding a new track that
            // would be unsubscribed immediately on the next sort.
            if (this.subscribedMicrophoneTrackPublications.size >= this.microphoneCapacity) {
                const lastItemOfSortedResult = this.lastSortingResult.at(-1);

                if (lastItemOfSortedResult) {
                    const comparison = sortAudioPublications([
                        lastItemOfSortedResult,
                        { publication: pub, participant },
                    ]);

                    if (comparison[0].publication.trackSid === lastItemOfSortedResult.publication.trackSid) {
                        return;
                    }
                }
            }

            pub.setSubscribed(true);
            pub.setEnabled(true);

            this.handleCacheUpdate(pub, participant);
        }
    };

    handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
        if (participant.identity === this.room.localParticipant.identity) {
            return;
        }

        if (publication.source === Track.Source.Microphone && !publication.isSubscribed) {
            const pub = publication as RemoteTrackPublication;
            const trackKey = trackKeyOf(participant, pub);

            if (this.activeRecoveries.has(trackKey)) {
                // eslint-disable-next-line no-console
                console.log('Skipping handleTrackUnmuted, recovery in progress for trackKey:', trackKey);
                return;
            }

            pub.setSubscribed(true);
            pub.setEnabled(true);

            this.handleCacheUpdate(pub, participant as RemoteParticipant);
        }
    };

    handleTrackUnpublished = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (participant.identity === this.room.localParticipant.identity) {
            return;
        }

        if (publication.source === Track.Source.Microphone) {
            this.subscribedMicrophoneTrackPublications.delete(publication.trackSid);

            this.lastSortingResult = this.lastSortingResult.filter(
                (item) => item.publication.trackSid !== publication.trackSid
            );

            this.cleanupRecoveryState(trackKeyOf(participant, publication));
        }
    };

    handleActiveSpeakerChanged = (participants: Participant[]) => {
        participants.forEach((participant) => {
            if (participant.identity === this.room.localParticipant.identity) {
                return;
            }

            const microphoneAudioPublication = [...participant.audioTrackPublications.values()].find(
                (item) => item.source === Track.Source.Microphone
            ) as RemoteTrackPublication;

            if (microphoneAudioPublication && !microphoneAudioPublication.isSubscribed) {
                const trackKey = trackKeyOf(participant, microphoneAudioPublication);

                if (this.activeRecoveries.has(trackKey)) {
                    // eslint-disable-next-line no-console
                    console.log('Skipping handleActiveSpeakerChanged, recovery in progress for trackKey:', trackKey);
                    return;
                }

                microphoneAudioPublication.setSubscribed(true);
                microphoneAudioPublication.setEnabled(true);
                this.handleCacheUpdate(microphoneAudioPublication, participant as RemoteParticipant);
            }
        });
    };

    handleParticipantDisconnected = (participant: RemoteParticipant) => {
        for (const trackKey of [...this.activeRecoveries]) {
            if (trackKey.startsWith(`${participant.sid}-`)) {
                this.cleanupRecoveryState(trackKey);
            }
        }
    };

    handleRoomDisconnected = () => {
        this.recoveryTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.subscribedMicrophoneTrackPublications.clear();
        this.recoveryTimeouts.clear();
        this.activeRecoveries.clear();
    };

    listenToRoomEvents() {
        this.room.on(RoomEvent.TrackPublished, this.handleAudioTrackPublished);
        this.room.on(RoomEvent.TrackUnmuted, this.handleTrackUnmuted);
        this.room.on(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
        this.room.on(RoomEvent.Connected, this.handleRoomConnected);
        this.room.on(RoomEvent.Disconnected, this.handleRoomDisconnected);
        this.room.on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);
        this.room.on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakerChanged);
    }

    cleanupEventListeners() {
        this.room.off(RoomEvent.TrackPublished, this.handleAudioTrackPublished);
        this.room.off(RoomEvent.TrackUnmuted, this.handleTrackUnmuted);
        this.room.off(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
        this.room.off(RoomEvent.Connected, this.handleRoomConnected);
        this.room.off(RoomEvent.Disconnected, this.handleRoomDisconnected);
        this.room.off(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);
        this.room.off(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakerChanged);
    }

    /**
     * Implementation of {@link AudioRecoveryAPI.isRecovering}. The recovery
     * manager polls this every 2s to skip detection while the dance is
     * running.
     */
    isRecovering = (trackKey: string): boolean => this.activeRecoveries.has(trackKey);

    /**
     * Implementation of {@link AudioRecoveryAPI.recoverTrack}. Executes a
     * disable → unsubscribe → wait → resubscribe → enable cycle on the
     * publication, with Safari-specific delays. Marks the track as actively
     * recovering for the duration of the dance plus a short cooldown so the
     * other event handlers in this class don't race with the new transceiver.
     *
     * Resolves once the cycle finishes; the recovery manager observes the
     * post-recovery RTP stats to decide success/failure.
     */
    recoverTrack = async (
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
        reason: RecoveryReason
    ): Promise<void> => {
        const trackKey = trackKeyOf(participant, publication);

        if (this.activeRecoveries.has(trackKey)) {
            // eslint-disable-next-line no-console
            console.warn('AudioTrackSubscriptionManager: recovery already in progress', { trackKey, reason });
            return;
        }

        this.activeRecoveries.add(trackKey);
        // eslint-disable-next-line no-console
        console.log('AudioTrackSubscriptionManager: recoverTrack starting', { trackKey, reason });

        try {
            if (publication.isEnabled) {
                publication.setEnabled(false);
                await wait(isSafari() ? 300 : 100);
            }
            if (!this.activeRecoveries.has(trackKey)) {
                return;
            }

            if (publication.isSubscribed) {
                publication.setSubscribed(false);
                await wait(isSafari() ? 1500 : 500);
            }
            if (!this.activeRecoveries.has(trackKey)) {
                return;
            }

            if (!this.subscribedMicrophoneTrackPublications.has(publication.trackSid)) {
                // eslint-disable-next-line no-console
                console.log('AudioTrackSubscriptionManager: publication left cache mid-recovery, aborting', trackKey);
                this.cleanupRecoveryState(trackKey);
                return;
            }

            if (publication.isSubscribed) {
                // eslint-disable-next-line no-console
                console.warn(
                    'AudioTrackSubscriptionManager: still subscribed after setSubscribed(false), retrying',
                    trackKey
                );
                publication.setSubscribed(false);
                await wait(isSafari() ? 500 : 200);
            }

            if (!publication.isSubscribed) {
                publication.setSubscribed(true);
                await wait(isSafari() ? 500 : 100);
            }
            if (!publication.isSubscribed) {
                // eslint-disable-next-line no-console
                console.error('AudioTrackSubscriptionManager: failed to resubscribe', trackKey);
                this.cleanupRecoveryState(trackKey);
                return;
            }

            if (!publication.isEnabled) {
                publication.setEnabled(true);
                await wait(isSafari() ? 200 : 50);
            }

            // eslint-disable-next-line no-console
            console.log('AudioTrackSubscriptionManager: recoverTrack completed', {
                trackKey,
                reason,
                cooldownMs: this.RECOVERY_COOLDOWN,
            });

            const timeout = setTimeout(() => {
                this.activeRecoveries.delete(trackKey);
                this.recoveryTimeouts.delete(trackKey);
            }, this.RECOVERY_COOLDOWN);
            this.recoveryTimeouts.set(trackKey, timeout);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('AudioTrackSubscriptionManager: recoverTrack threw', error, { trackKey, reason });
            this.reportError?.('AudioTrackSubscriptionManager: recoverTrack threw', {
                level: 'error',
                context: { error, trackKey, participant: participant.identity, trackSid: publication.trackSid },
            });
            this.cleanupRecoveryState(trackKey);
        }
    };

    private cleanupRecoveryState = (trackKey: string) => {
        this.activeRecoveries.delete(trackKey);
        const timeout = this.recoveryTimeouts.get(trackKey);
        if (timeout) {
            clearTimeout(timeout);
            this.recoveryTimeouts.delete(trackKey);
        }
    };

    reconcileAudioTracks = () => {
        if (this.room.state !== ConnectionState.Connected) {
            return;
        }

        const microphoneAudioPublications: PublicationItem[] = this.getMicrophoneAudioPublications();

        const sortedMicrophoneAudioPublications = sortAudioPublications(microphoneAudioPublications);

        const microphoneAudioPublicationsToPotentiallySubscribe = sortedMicrophoneAudioPublications.slice(
            0,
            this.microphoneCapacity
        );

        const publicationsToSubscribe = microphoneAudioPublicationsToPotentiallySubscribe.filter(
            (publication) => !this.subscribedMicrophoneTrackPublications.has(publication.publication.trackSid)
        );

        publicationsToSubscribe.forEach((publication) => {
            publication.publication.setSubscribed(true);
            publication.publication.setEnabled(true);

            this.handleCacheUpdate(publication.publication, publication.participant);
        });

        const currentCacheValues = Array.from(this.subscribedMicrophoneTrackPublications.values());

        currentCacheValues.forEach((item) => {
            const trackKey = trackKeyOf(item.participant, item.publication);

            if (this.activeRecoveries.has(trackKey)) {
                // eslint-disable-next-line no-console
                console.log('Skipping reconcile for track in recovery:', trackKey);
                return;
            }

            if (!item.publication.isSubscribed) {
                item.publication.setSubscribed(true);
            }

            if (item.publication.isSubscribed && !item.publication.isEnabled) {
                item.publication.setEnabled(true);
            }
        });
    };

    setupReconcileLoop = () => {
        this.reconcileInterval = setInterval(() => {
            this.reconcileAudioTracks();
        }, 5000);
    };

    cleanupReconcileLoop = () => {
        if (this.reconcileInterval) {
            clearInterval(this.reconcileInterval);
        }
    };

    setup = () => {
        this.listenToRoomEvents();
        this.setupReconcileLoop();
    };

    cleanup = () => {
        this.recoveryTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.subscribedMicrophoneTrackPublications.clear();
        this.lastSortingResult = [];
        this.recoveryTimeouts.clear();
        this.activeRecoveries.clear();
        this.cleanupEventListeners();
        this.cleanupReconcileLoop();
    };
}

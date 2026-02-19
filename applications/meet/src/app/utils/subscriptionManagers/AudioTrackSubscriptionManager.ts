import type { Participant, TrackPublication } from 'livekit-client';
import {
    ConnectionState,
    type RemoteParticipant,
    type RemoteTrackPublication,
    type Room,
    RoomEvent,
    Track,
} from 'livekit-client';

import { wait } from '@proton/shared/lib/helpers/promise';

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

export class AudioTrackSubscriptionManager {
    private microphoneCapacity: number;
    private room: Room;
    private reportError?: (label: string, options?: unknown) => void;
    private subscribedMicrophoneTrackPublications: Map<string, PublicationItem> = new Map();
    private lastSortingResult: PublicationItem[] = [];
    private reconcileInterval: NodeJS.Timeout | null = null;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private recoveryAttempts = new Map<string, number>();
    private recoveryTimeouts = new Map<string, NodeJS.Timeout>();
    private activeRecoveries = new Set<string>();
    private recoveryReasons = new Map<string, 'stalled' | 'concealment'>();
    private lastPacketCounts = new Map<string, number>();
    private firstSeenWithoutStats = new Map<string, number>();
    private consecutiveHighConcealment = new Map<string, number>();
    private lastConcealmentStats = new Map<
        string,
        { concealedSamples: number; silentConcealedSamples: number; totalSamplesReceived: number; timestamp: number }
    >();
    private isRoomReconnecting = false;
    private MAX_RECOVERY_ATTEMPTS = 3;
    private RECOVERY_COOLDOWN = 3_000;
    private HEALTH_CHECK_INTERVAL = 2_000;
    private MISSING_STATS_GRACE_PERIOD = 5_000;
    private CONCEALMENT_RATIO_THRESHOLD = 0.15;
    private RECENT_CONCEALMENT_THRESHOLD = 0.25;

    constructor(capacity: number, room: Room, reportError?: (label: string, options?: unknown) => void) {
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
            // If the cache if already full, we prevent adding a new track that would be unsubscribed immediately
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

            // Clean up any ongoing recovery for this track
            const trackKey = `${participant.sid}-${publication.trackSid}`;
            this.cleanupRecovery(trackKey);
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
                microphoneAudioPublication.setSubscribed(true);
                microphoneAudioPublication.setEnabled(true);
                this.handleCacheUpdate(microphoneAudioPublication, participant as RemoteParticipant);
            }
        });
    };

    handleParticipantDisconnected = (participant: RemoteParticipant) => {
        // Clean up all recoveries for this participant
        const keysToCleanup: string[] = [];
        for (const key of this.recoveryAttempts.keys()) {
            if (key.startsWith(participant.sid)) {
                keysToCleanup.push(key);
            }
        }
        keysToCleanup.forEach((key) => this.cleanupRecovery(key));
    };

    handleRoomDisconnected = () => {
        // Clear all timeouts before clearing maps
        this.recoveryTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.subscribedMicrophoneTrackPublications.clear();
        this.recoveryAttempts.clear();
        this.recoveryTimeouts.clear();
        this.activeRecoveries.clear();
        this.lastPacketCounts.clear();
        this.firstSeenWithoutStats.clear();
        this.consecutiveHighConcealment.clear();
        this.lastConcealmentStats.clear();
        this.isRoomReconnecting = false;
    };

    handleConnectionStateChanged = (state: ConnectionState) => {
        // Prevent recovery attempts when the room is reconnecting
        if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
            // eslint-disable-next-line no-console
            console.log('Room is reconnecting, pausing track recovery attempts');
            this.isRoomReconnecting = true;
        } else if (state === ConnectionState.Connected) {
            // eslint-disable-next-line no-console
            console.log('Room reconnected, resuming track recovery attempts');
            this.isRoomReconnecting = false;
        }
    };

    listenToRoomEvents() {
        this.room.on(RoomEvent.TrackPublished, this.handleAudioTrackPublished);
        this.room.on(RoomEvent.TrackUnmuted, this.handleTrackUnmuted);
        this.room.on(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
        this.room.on(RoomEvent.Connected, this.handleRoomConnected);
        this.room.on(RoomEvent.Disconnected, this.handleRoomDisconnected);
        this.room.on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);
        this.room.on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakerChanged);
        this.room.on(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged);
    }

    cleanupEventListeners() {
        this.room.off(RoomEvent.TrackPublished, this.handleAudioTrackPublished);
        this.room.off(RoomEvent.TrackUnmuted, this.handleTrackUnmuted);
        this.room.off(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
        this.room.off(RoomEvent.Connected, this.handleRoomConnected);
        this.room.off(RoomEvent.Disconnected, this.handleRoomDisconnected);
        this.room.off(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);
        this.room.off(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakerChanged);
        this.room.off(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged);
    }

    private async attemptRecovery(
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
        trackKey: string
    ): Promise<void> {
        // Skip recovery if room is reconnecting
        if (this.isRoomReconnecting) {
            // eslint-disable-next-line no-console
            console.log('Skipping recovery attempt, room is reconnecting');
            return;
        }

        // Prevent concurrent recoveries for same track
        if (this.activeRecoveries.has(trackKey)) {
            // eslint-disable-next-line no-console
            console.warn('Recovery already in progress for trackKey:', trackKey);
            return;
        }

        const attempts = this.recoveryAttempts.get(trackKey) || 0;

        if (attempts >= this.MAX_RECOVERY_ATTEMPTS) {
            const context = {
                localParticipant: this.room.localParticipant.identity,
                room: this.room.name,
                participant: participant.identity,
                trackSid: publication.trackSid,
                attempts,
            };
            // eslint-disable-next-line no-console
            console.error('Max recovery attempts reached', context);
            this.reportError?.('AudioTrackSubscriptionManager: Max recovery attempts reached', {
                level: 'error',
                context,
            });

            this.cleanupRecovery(trackKey);
            return;
        }

        // Mark recovery as active
        this.activeRecoveries.add(trackKey);
        this.recoveryAttempts.set(trackKey, attempts + 1);

        try {
            // eslint-disable-next-line no-console
            console.log(`Recovery attempt ${attempts + 1}/${this.MAX_RECOVERY_ATTEMPTS}`);
            // Make sure we detach old audio element before unsubscribing, helps to avoid a random echo
            publication.setEnabled(false);
            await wait(100);
            publication.setSubscribed(false);
            await wait(500);

            // Check if recovery is still active and publication is still valid after the wait
            if (!this.activeRecoveries.has(trackKey)) {
                // eslint-disable-next-line no-console
                console.log('Recovery was cleaned up during wait, aborting');
                return;
            }

            // Check if publication is still in the cache
            if (!this.subscribedMicrophoneTrackPublications.has(publication.trackSid)) {
                // eslint-disable-next-line no-console
                console.log('Publication was removed from cache during wait, aborting recovery');
                this.cleanupRecovery(trackKey);
                return;
            }

            publication.setSubscribed(true);
            await wait(100);
            // Attach new audio element cleanly
            publication.setEnabled(true);

            // Check if successful in the next recovery attempt
            const timeout = setTimeout(() => {
                this.activeRecoveries.delete(trackKey);
            }, this.RECOVERY_COOLDOWN);

            // Store timeout for cleanup
            this.recoveryTimeouts.set(trackKey, timeout);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Recovery attempt failed', error);
            this.reportError?.('AudioTrackSubscriptionManager: Recovery attempt failed', {
                level: 'error',
                context: { error, trackKey, participant: participant.identity, trackSid: publication.trackSid },
            });
            this.activeRecoveries.delete(trackKey);
        }
    }

    private cleanupRecovery(trackKey: string): void {
        this.recoveryAttempts.delete(trackKey);
        this.activeRecoveries.delete(trackKey);
        this.recoveryReasons.delete(trackKey);
        this.lastPacketCounts.delete(trackKey);
        this.firstSeenWithoutStats.delete(`firstSeen-${trackKey}`);
        this.consecutiveHighConcealment.delete(trackKey);
        this.lastConcealmentStats.delete(trackKey);

        const timeout = this.recoveryTimeouts.get(trackKey);
        if (timeout) {
            clearTimeout(timeout);
            this.recoveryTimeouts.delete(trackKey);
        }
    }

    private checkBrokenTransceivers = async () => {
        if (this.room.state !== ConnectionState.Connected) {
            return;
        }

        try {
            const subscriberPC = (this.room.engine as any).pcManager?.subscriber?.pc;
            if (!subscriberPC) {
                return;
            }

            const stats = await subscriberPC.getStats();
            const currentCacheValues = Array.from(this.subscribedMicrophoneTrackPublications.values());

            for (const item of currentCacheValues) {
                const { publication, participant } = item;
                const track = publication.track;
                const trackKey = `${participant.sid}-${publication.trackSid}`;

                // Clear packet tracking for muted tracks to avoid false positives when unmuting
                if (publication.isMuted) {
                    this.lastPacketCounts.delete(trackKey);
                }

                // Skip if not subscribed, muted, or already recovering
                if (!publication.isSubscribed || publication.isMuted || this.activeRecoveries.has(trackKey) || !track) {
                    continue;
                }

                const trackId = track.mediaStreamTrack?.id;
                if (!trackId) {
                    continue;
                }

                // Look for inbound-rtp stats for this track
                let foundStats = false;
                let packetsReceived = 0;

                for (const [, value] of stats) {
                    if (value.type === 'inbound-rtp' && value.kind === 'audio' && value.trackIdentifier === trackId) {
                        foundStats = true;
                        packetsReceived = value.packetsReceived || 0;
                        break;
                    }
                }

                // If inbound-rtp stats missing entirely
                if (!foundStats && track.mediaStreamTrack?.readyState === 'live') {
                    const firstSeenKey = `firstSeen-${trackKey}`;
                    const firstSeenTime = this.firstSeenWithoutStats.get(firstSeenKey);

                    if (!firstSeenTime) {
                        // First time seeing missing stats - give it grace period (track might be initializing)
                        this.firstSeenWithoutStats.set(firstSeenKey, Date.now());
                        continue;
                    }

                    const missingDuration = Date.now() - firstSeenTime;
                    if (missingDuration > this.MISSING_STATS_GRACE_PERIOD) {
                        const context = {
                            localParticipant: this.room.localParticipant.identity,
                            room: this.room.name,
                            participant: participant.identity,
                            trackSid: publication.trackSid,
                            missingDuration,
                        };
                        // eslint-disable-next-line no-console
                        console.warn('Detected missing inbound-rtp stats', context);
                        this.reportError?.('AudioTrackSubscriptionManager: Detected missing inbound-rtp stats', {
                            level: 'warning',
                            context,
                        });

                        void this.attemptRecovery(publication, participant, trackKey);
                        this.firstSeenWithoutStats.delete(firstSeenKey);
                    }
                    continue;
                } else if (foundStats) {
                    // Stats appeared, clear the tracking
                    const firstSeenKey = `firstSeen-${trackKey}`;
                    this.firstSeenWithoutStats.delete(firstSeenKey);
                }

                // If packets number is freezing
                const lastPackets = this.lastPacketCounts.get(trackKey) || 0;
                this.lastPacketCounts.set(trackKey, packetsReceived);

                // If packets haven't increased in 2 checks (6 seconds with 3s interval), but track is live
                // This gives time for natural network jitter without false alarms
                if (
                    lastPackets > 0 &&
                    packetsReceived === lastPackets &&
                    track.mediaStreamTrack?.readyState === 'live'
                ) {
                    const context = {
                        localParticipant: this.room.localParticipant.identity,
                        room: this.room.name,
                        participant: participant.identity,
                        trackSid: publication.trackSid,
                        packetsReceived,
                        lastPackets,
                    };
                    // eslint-disable-next-line no-console
                    console.warn('Detected stalled audio', context);
                    this.reportError?.('AudioTrackSubscriptionManager: Detected stalled audio', {
                        level: 'warning',
                        context,
                    });

                    this.recoveryReasons.set(trackKey, 'stalled');
                    void this.attemptRecovery(publication, participant, trackKey);
                    continue;
                }

                // If track is healthy and was in recovery, cleanup recovery state
                // This validates that the previous recovery attempt was successful
                if (this.recoveryAttempts.has(trackKey) && this.recoveryReasons.get(trackKey) === 'stalled') {
                    const attempts = this.recoveryAttempts.get(trackKey) || 0;
                    const context = {
                        localParticipant: this.room.localParticipant.identity,
                        room: this.room.name,
                        participant: participant.identity,
                        trackSid: publication.trackSid,
                        recoveryAttempts: attempts,
                    };
                    // eslint-disable-next-line no-console
                    console.log('Track recovered successfully', context);
                    this.reportError?.('AudioTrackSubscriptionManager: Track recovered successfully', {
                        level: 'info',
                        context,
                    });
                    this.cleanupRecovery(trackKey);
                }
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error checking broken transceivers:', error);
            this.reportError?.('AudioTrackSubscriptionManager: Error checking broken transceivers', {
                level: 'error',
                context: { error },
            });
        }
    };

    private checkAudioConcealment = async () => {
        if (this.room.state !== ConnectionState.Connected) {
            return;
        }

        try {
            const subscriberPC = (this.room.engine as any).pcManager?.subscriber?.pc;
            if (!subscriberPC) {
                return;
            }

            const stats = await subscriberPC.getStats();
            const currentCacheValues = Array.from(this.subscribedMicrophoneTrackPublications.values());
            let tracksWithHighConcealment = 0;

            for (const item of currentCacheValues) {
                const { publication, participant } = item;
                const track = publication.track;
                const trackKey = `${participant.sid}-${publication.trackSid}`;

                // Skip if not subscribed, muted, already recovering, or no track
                if (!publication.isSubscribed || publication.isMuted || this.activeRecoveries.has(trackKey) || !track) {
                    continue;
                }

                const trackId = track.mediaStreamTrack?.id;
                if (!trackId) {
                    continue;
                }

                // Look for inbound-rtp stats for this audio track
                for (const [, value] of stats) {
                    if (value.type === 'inbound-rtp' && value.kind === 'audio' && value.trackIdentifier === trackId) {
                        const concealedSamples = value.concealedSamples || 0;
                        const totalSamplesReceived = value.totalSamplesReceived || 0;
                        const silentConcealedSamples = value.silentConcealedSamples || 0;
                        const concealmentEvents = value.concealmentEvents || 0;

                        // Only check if we have received enough samples
                        if (totalSamplesReceived < 1000) {
                            continue;
                        }

                        // Calculate non-silent concealment (excludes concealedSamples generated by mute/silence)
                        const nonSilentConcealedSamples = concealedSamples - silentConcealedSamples;
                        const nonSilentConcealmentRatio = nonSilentConcealedSamples / totalSamplesReceived;

                        // Delta-based detection: Check recent non-silent concealment rate
                        const lastStats = this.lastConcealmentStats.get(trackKey);
                        let recentNonSilentConcealmentRatio = 0;
                        let hasRecentData = false;

                        if (lastStats) {
                            const newConcealedSamples = concealedSamples - lastStats.concealedSamples;
                            const newSilentConcealedSamples = silentConcealedSamples - lastStats.silentConcealedSamples;
                            const newNonSilentConcealedSamples = newConcealedSamples - newSilentConcealedSamples;
                            const newTotalSamples = totalSamplesReceived - lastStats.totalSamplesReceived;

                            // We set the samples size to, at least, 500 for meaningful measurement
                            if (newTotalSamples >= 500) {
                                recentNonSilentConcealmentRatio = newNonSilentConcealedSamples / newTotalSamples;
                                hasRecentData = true;
                            }
                        }

                        // Store current stats for next delta calculation
                        this.lastConcealmentStats.set(trackKey, {
                            concealedSamples,
                            silentConcealedSamples,
                            totalSamplesReceived,
                            timestamp: Date.now(),
                        });

                        // Trigger if either:
                        // 1. Recent non-silent concealment is severe (25%+) - immediate trigger
                        // 2. Cumulative non-silent concealment is high (15%+) after 2 consecutive checks - gradual degradation
                        const recentConcealmentCritical =
                            hasRecentData && recentNonSilentConcealmentRatio > this.RECENT_CONCEALMENT_THRESHOLD;
                        const cumulativeConcealmentHigh = nonSilentConcealmentRatio > this.CONCEALMENT_RATIO_THRESHOLD;

                        if (recentConcealmentCritical || cumulativeConcealmentHigh) {
                            tracksWithHighConcealment++;

                            // Track consecutive high concealment checks
                            const consecutiveCount = (this.consecutiveHighConcealment.get(trackKey) || 0) + 1;
                            this.consecutiveHighConcealment.set(trackKey, consecutiveCount);

                            // Immediate trigger if recent concealment is critical
                            // Or trigger after 2 consecutive checks if cumulative is high
                            const shouldTrigger = recentConcealmentCritical || consecutiveCount >= 2;

                            if (shouldTrigger) {
                                const context = {
                                    localParticipant: this.room.localParticipant.identity,
                                    room: this.room.name,
                                    participant: participant.identity,
                                    trackSid: publication.trackSid,
                                    nonSilentConcealmentRatio: nonSilentConcealmentRatio.toFixed(3),
                                    recentNonSilentConcealmentRatio: hasRecentData
                                        ? recentNonSilentConcealmentRatio.toFixed(3)
                                        : 'N/A',
                                    concealedSamples,
                                    silentConcealedSamples,
                                    nonSilentConcealedSamples,
                                    totalSamplesReceived,
                                    concealmentEvents,
                                    consecutiveChecks: consecutiveCount,
                                    triggerReason: recentConcealmentCritical
                                        ? 'recent_samples_critical'
                                        : 'cumulative_high',
                                };

                                // eslint-disable-next-line no-console
                                console.warn('Detected high audio concealment', context);

                                this.reportError?.('AudioTrackSubscriptionManager: High audio concealment detected', {
                                    level: 'warning',
                                    context,
                                });

                                this.recoveryReasons.set(trackKey, 'concealment');
                                void this.attemptRecovery(publication, participant, trackKey);
                            }
                        } else {
                            // Concealment is back to normal
                            this.consecutiveHighConcealment.delete(trackKey);

                            // If track recovered and was in recovery, cleanup recovery state
                            if (
                                this.recoveryAttempts.has(trackKey) &&
                                this.recoveryReasons.get(trackKey) === 'concealment'
                            ) {
                                const attempts = this.recoveryAttempts.get(trackKey) || 0;
                                const context = {
                                    localParticipant: this.room.localParticipant.identity,
                                    room: this.room.name,
                                    participant: participant.identity,
                                    trackSid: publication.trackSid,
                                    recoveryAttempts: attempts,
                                    finalNonSilentConcealmentRatio: nonSilentConcealmentRatio.toFixed(3),
                                };
                                // eslint-disable-next-line no-console
                                console.log('Track recovered successfully', context);
                                this.reportError?.('AudioTrackSubscriptionManager: Track recovered successfully', {
                                    level: 'info',
                                    context,
                                });
                                this.cleanupRecovery(trackKey);
                            }
                        }
                        break;
                    }
                }
            }

            // Log if multiple tracks have high concealment
            if (tracksWithHighConcealment >= 3) {
                this.reportError?.(
                    'AudioTrackSubscriptionManager: Multiple tracks with high concealment (E2EE overload)',
                    {
                        level: 'warning',
                        context: {
                            affectedTracks: tracksWithHighConcealment,
                            totalSubscribedTracks: currentCacheValues.length,
                        },
                    }
                );
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error checking audio concealment:', error);
            this.reportError?.('AudioTrackSubscriptionManager: Error checking audio concealment', {
                level: 'error',
                context: { error },
            });
        }
    };

    reconcileAudioTracks = () => {
        if (this.room.state !== ConnectionState.Connected) {
            return;
        }

        const microphoneAudioPublications: PublicationItem[] = this.getMicrophoneAudioPublications();

        const sortedMicrophoneAudioPublications = sortAudioPublications(microphoneAudioPublications);

        // Get the top N publications. Ideally this is the same as the sorted cache.
        const microphoneAudioPublicationsToPotentiallySubscribe = sortedMicrophoneAudioPublications.slice(
            0,
            this.microphoneCapacity
        );

        // Get the publications that are not in the cache
        const publicationsToSubscribe = microphoneAudioPublicationsToPotentiallySubscribe.filter(
            (publication) => !this.subscribedMicrophoneTrackPublications.has(publication.publication.trackSid)
        );

        // Subscribe to the publications that were not in the cache
        // The handleCacheUpdate method will evict the oldest publication if the cache is full
        publicationsToSubscribe.forEach((publication) => {
            publication.publication.setSubscribed(true);
            publication.publication.setEnabled(true);

            this.handleCacheUpdate(publication.publication, publication.participant);
        });

        const currentCacheValues = Array.from(this.subscribedMicrophoneTrackPublications.values());

        // If any items from the cache lost subscription, we re-subscribe them
        currentCacheValues.forEach((item) => {
            const trackKey = `${item.participant.sid}-${item.publication.trackSid}`;

            // Skip if recovery already in progress for this track
            if (this.activeRecoveries.has(trackKey)) {
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

    setupHealthCheckLoop = () => {
        this.healthCheckInterval = setInterval(() => {
            void this.checkBrokenTransceivers();
            void this.checkAudioConcealment();
        }, this.HEALTH_CHECK_INTERVAL);
    };

    cleanupHealthCheckLoop = () => {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    };

    setup = () => {
        this.listenToRoomEvents();
        this.setupReconcileLoop();
        this.setupHealthCheckLoop();
    };

    cleanup = () => {
        // Clear all timeouts first
        this.recoveryTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.subscribedMicrophoneTrackPublications.clear();
        this.lastSortingResult = [];
        this.recoveryAttempts.clear();
        this.recoveryTimeouts.clear();
        this.activeRecoveries.clear();
        this.lastPacketCounts.clear();
        this.firstSeenWithoutStats.clear();
        this.consecutiveHighConcealment.clear();
        this.lastConcealmentStats.clear();
        this.cleanupEventListeners();
        this.cleanupReconcileLoop();
        this.cleanupHealthCheckLoop();
    };
}

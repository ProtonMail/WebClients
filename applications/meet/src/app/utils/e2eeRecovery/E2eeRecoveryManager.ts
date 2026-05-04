import type { Participant, RemoteParticipant, RemoteTrackPublication, Room } from 'livekit-client';
import { ConnectionQuality, ConnectionState, RoomEvent, Track } from 'livekit-client';

import { isSafari } from '@proton/shared/lib/helpers/browser';
import { isDocumentVisible } from '@proton/shared/lib/helpers/dom';

import { collectReceiverStats } from './inboundRtpStats';
import { E2EE_RECOVERY_TUNING_DEFAULT, type E2eeRecoveryTuning } from './recoveryTuning';
import type { ReceiverStatsTick, RecoveryReason, ReportError } from './types';

export type { E2eeRecoveryProfile, E2eeRecoveryTuning } from './recoveryTuning';
export { E2EE_RECOVERY_TUNING_AGGRESSIVE, E2EE_RECOVERY_TUNING_DEFAULT, getE2eeRecoveryTuning } from './recoveryTuning';

/**
 * Minimal contract the recovery manager needs from the audio subscription
 * manager. The audio manager owns the unsubscribe/wait/subscribe/enable
 * dance because it must coordinate with its own subscription cache and
 * event handlers; the recovery manager just decides *when* to call it.
 */
export interface AudioRecoveryAPI {
    isRecovering(trackKey: string): boolean;
    recoverTrack(
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
        reason: RecoveryReason
    ): Promise<void>;
}

export interface E2eeRecoveryManagerOptions {
    room: Room;
    audioManager: AudioRecoveryAPI;
    reportError?: ReportError;
    /** When true the manager only logs detections, never recovers. */
    disabled?: boolean;
    /**
     * Enables the {@link E2eeRecoveryManager.checkAudioPersistentNoise}
     * detector. It is the most aggressive detector and the most prone to
     * false positives on healthy speech, so it is opt-in via the
     * `MeetE2eeAudioNoiseDetection` flag while we monitor real-world
     * behaviour. The other detectors (missing-stats, stalled, concealment,
     * video stall) match what shipped before the recovery refactor and stay
     * always-on.
     */
    persistentNoiseDetectionEnabled?: boolean;
    /**
     * Detector thresholds and timing. Defaults to {@link E2EE_RECOVERY_TUNING_DEFAULT}.
     * Use {@link getE2eeRecoveryTuning} or pass {@link E2EE_RECOVERY_TUNING_AGGRESSIVE} for a more sensitive profile.
     */
    tuning?: E2eeRecoveryTuning;
}

interface VideoStallState {
    lastPkts: number;
    lastFrames: number;
    stuckTicks: number;
}

interface ConcealmentSnapshot {
    concealedSamples: number;
    silentConcealedSamples: number;
    totalSamplesReceived: number;
}

interface EnergySnapshot {
    totalAudioEnergy: number;
    totalSamplesReceived: number;
}

const trackKeyOf = (participant: { sid: string }, publication: { trackSid: string }): string =>
    `${participant.sid}-${publication.trackSid}`;

/**
 * Coordinates detection and recovery of broken E2EE FrameCryptors. Polls
 * RTP stats on the configured poll interval and runs several independent
 * detectors:
 *
 * - **video stall**: pktsRx grows but framesDecoded stays frozen. Almost
 *   always indicates a broken video cryptor. We also recover the same
 *   participant's audio because the audio cryptor is on the same key state.
 * - **audio missing stats**: track is subscribed but produces no
 *   inbound-rtp entry within a grace period.
 * - **audio stalled**: pktsRx is frozen for a continuously-unmuted track.
 * - **audio concealment**: high non-silent concealment ratio, either
 *   recently or cumulatively.
 * - **audio persistent noise**: corrupted cryptor producing continuous
 *   metallic noise — sustained high energy/sample ratio with no audioLevel
 *   dips.
 *
 * Also listens to {@link RoomEvent.EncryptionError} as an early signal
 * (rare in practice but free) and triggers a per-participant recovery.
 *
 * Recovery is delegated:
 * - Video tracks are resubscribed in-place via setSubscribed(false/true).
 * - Audio tracks go through the supplied {@link AudioRecoveryAPI} so the
 *   subscription manager can coordinate with its cache and event guards.
 */
export class E2eeRecoveryManager {
    private readonly room: Room;
    private readonly audioManager: AudioRecoveryAPI;
    private readonly reportError?: ReportError;
    private readonly disabled: boolean;
    private readonly persistentNoiseDetectionEnabled: boolean;
    private readonly tuning: E2eeRecoveryTuning;

    private tickInterval: NodeJS.Timeout | null = null;
    private isTickRunning = false;
    private isRoomReconnecting = false;

    private videoStallState = new Map<string, VideoStallState>();
    private firstSeenWithoutStats = new Map<string, number>();
    private firstUnmutedTime = new Map<string, number>();
    private lastPacketCounts = new Map<string, number>();
    private lastConcealmentStats = new Map<string, ConcealmentSnapshot>();
    private lastEnergyStats = new Map<string, EnergySnapshot>();
    private consecutiveHighConcealment = new Map<string, number>();
    private consecutiveNoiseTicks = new Map<string, number>();

    // Per-track recovery accounting. recoveryAttempts only clears when a
    // track is validated as recovered or the participant disconnects.
    private recoveryAttempts = new Map<string, number>();
    private recoveryReasons = new Map<string, RecoveryReason>();
    private recoveryHealthyTicks = new Map<string, number>();
    private recoveryPacketProgress = new Map<string, boolean>();

    // Per-participant cooldowns and pending encryption-error timers.
    private lastRecoverByParticipant = new Map<string, number>();
    private pendingEncryptionRecoveryTimers = new Map<string, NodeJS.Timeout>();

    constructor({
        room,
        audioManager,
        reportError,
        disabled = false,
        persistentNoiseDetectionEnabled = false,
        tuning = E2EE_RECOVERY_TUNING_DEFAULT,
    }: E2eeRecoveryManagerOptions) {
        this.room = room;
        this.audioManager = audioManager;
        this.reportError = reportError;
        this.disabled = disabled;
        this.persistentNoiseDetectionEnabled = persistentNoiseDetectionEnabled;
        this.tuning = tuning;
    }

    setup = () => {
        if (this.disabled) {
            // eslint-disable-next-line no-console
            console.log('E2eeRecoveryManager: disabled by flag, skipping setup');
            return;
        }

        this.tickInterval = setInterval(() => {
            void this.runTick();
        }, this.tuning.tickIntervalMs);

        this.room.on(RoomEvent.EncryptionError, this.handleEncryptionError);
        this.room.on(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged);
        this.room.on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);
    };

    cleanup = () => {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }

        this.pendingEncryptionRecoveryTimers.forEach((timer) => clearTimeout(timer));
        this.pendingEncryptionRecoveryTimers.clear();

        this.room.off(RoomEvent.EncryptionError, this.handleEncryptionError);
        this.room.off(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged);
        this.room.off(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);

        this.videoStallState.clear();
        this.firstSeenWithoutStats.clear();
        this.firstUnmutedTime.clear();
        this.lastPacketCounts.clear();
        this.lastConcealmentStats.clear();
        this.lastEnergyStats.clear();
        this.consecutiveHighConcealment.clear();
        this.consecutiveNoiseTicks.clear();
        this.recoveryAttempts.clear();
        this.recoveryReasons.clear();
        this.recoveryHealthyTicks.clear();
        this.recoveryPacketProgress.clear();
        this.lastRecoverByParticipant.clear();
    };

    private handleConnectionStateChanged = (state: ConnectionState) => {
        if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
            this.isRoomReconnecting = true;
        } else if (state === ConnectionState.Connected) {
            this.isRoomReconnecting = false;
        }
    };

    private handleParticipantDisconnected = (participant: RemoteParticipant) => {
        const prefix = `${participant.sid}-`;
        const removeIfMatching = (map: Map<string, unknown>) => {
            for (const key of [...map.keys()]) {
                if (key.startsWith(prefix)) {
                    map.delete(key);
                }
            }
        };

        removeIfMatching(this.videoStallState);
        removeIfMatching(this.firstSeenWithoutStats);
        removeIfMatching(this.firstUnmutedTime);
        removeIfMatching(this.lastPacketCounts);
        removeIfMatching(this.lastConcealmentStats);
        removeIfMatching(this.lastEnergyStats);
        removeIfMatching(this.consecutiveHighConcealment);
        removeIfMatching(this.consecutiveNoiseTicks);
        removeIfMatching(this.recoveryAttempts);
        removeIfMatching(this.recoveryReasons);
        removeIfMatching(this.recoveryHealthyTicks);
        removeIfMatching(this.recoveryPacketProgress);

        this.lastRecoverByParticipant.delete(participant.identity);
    };

    private runTick = async () => {
        if (this.isTickRunning) {
            return;
        }

        if (this.room.state !== ConnectionState.Connected) {
            return;
        }

        if (!isDocumentVisible() && isSafari()) {
            return;
        }

        this.isTickRunning = true;

        try {
            const ticks = await collectReceiverStats(this.room);

            const stuckParticipants = new Set<string>();

            for (const tick of ticks) {
                if (tick.kind === 'video') {
                    if (this.detectVideoStall(tick)) {
                        stuckParticipants.add(tick.participant.identity);
                    }
                    continue;
                }

                if (tick.kind === 'audio') {
                    this.runAudioDetectors(tick);
                }
            }

            for (const identity of stuckParticipants) {
                const participant = this.findParticipantByIdentity(identity);
                if (participant) {
                    void this.recoverParticipant(participant, 'video-stall');
                }
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('E2eeRecoveryManager tick failed', error);
            this.reportError?.('E2eeRecoveryManager: tick failed', {
                level: 'error',
                context: { error },
            });
        } finally {
            this.isTickRunning = false;
        }
    };

    private detectVideoStall = (tick: ReceiverStatsTick): boolean => {
        const { participant, publication, stats } = tick;
        if (!stats) {
            return false;
        }
        const trackKey = trackKeyOf(participant, publication);
        const pkts: number = stats.packetsReceived ?? 0;
        const frames: number = stats.framesDecoded ?? 0;
        const prev = this.videoStallState.get(trackKey) ?? { lastPkts: pkts, lastFrames: frames, stuckTicks: 0 };
        const pktsDelta = pkts - prev.lastPkts;
        const framesDelta = frames - prev.lastFrames;
        const isStuck = pktsDelta > this.tuning.videoPktsDeltaMin && framesDelta < this.tuning.videoFramesDeltaMin;
        const stuckTicks = isStuck ? prev.stuckTicks + 1 : 0;
        this.videoStallState.set(trackKey, { lastPkts: pkts, lastFrames: frames, stuckTicks });
        return stuckTicks >= this.tuning.videoStuckTicksThreshold;
    };

    private runAudioDetectors = (tick: ReceiverStatsTick) => {
        const { publication } = tick;
        if (publication.source !== Track.Source.Microphone) {
            return;
        }
        const trackKey = trackKeyOf(tick.participant, publication);

        // Skip while the audio manager is mid-recovery. We still update
        // baselines (handled inside each detector) so we don't trigger on
        // bogus deltas the moment the cooldown ends.
        const isRecovering = this.audioManager.isRecovering(trackKey);

        // Mute window resets some baselines; keep packet count to detect
        // "frozen across mute toggles" patterns.
        if (publication.isMuted) {
            this.firstUnmutedTime.delete(trackKey);
            this.lastConcealmentStats.delete(trackKey);
            this.consecutiveNoiseTicks.delete(trackKey);
            this.lastEnergyStats.delete(trackKey);
            return;
        }

        if (!publication.isSubscribed || !publication.track) {
            return;
        }

        if (!this.firstUnmutedTime.has(trackKey)) {
            this.firstUnmutedTime.set(trackKey, Date.now());
        }

        if (isRecovering) {
            // While the unsubscribe/subscribe dance is running we don't trust
            // counters at all and we don't fire new detections. We do clear
            // baselines so the next subscription starts fresh.
            this.lastConcealmentStats.delete(trackKey);
            this.lastPacketCounts.delete(trackKey);
            this.lastEnergyStats.delete(trackKey);
            this.consecutiveNoiseTicks.delete(trackKey);
            return;
        }

        if (this.checkAudioMissingStats(tick)) {
            return;
        }

        if (!tick.stats) {
            return;
        }

        // Order matters: stalled fires earliest, then concealment (also
        // owns post-recovery validation), then persistent-noise.
        if (this.checkAudioStalled(tick)) {
            return;
        }
        this.checkAudioConcealment(tick);
        if (this.persistentNoiseDetectionEnabled) {
            this.checkAudioPersistentNoise(tick);
        }
    };

    /**
     * Returns true if a recovery was triggered (caller should skip the rest
     * of the audio detectors for this tick).
     */
    private checkAudioMissingStats = (tick: ReceiverStatsTick): boolean => {
        const { publication, participant, stats } = tick;
        const trackKey = trackKeyOf(participant, publication);

        if (stats) {
            this.firstSeenWithoutStats.delete(trackKey);
            return false;
        }

        if (publication.track?.mediaStreamTrack?.readyState !== 'live') {
            return false;
        }

        const firstSeen = this.firstSeenWithoutStats.get(trackKey);
        if (!firstSeen) {
            this.firstSeenWithoutStats.set(trackKey, Date.now());
            return false;
        }

        const missingDuration = Date.now() - firstSeen;
        if (missingDuration <= this.tuning.missingStatsGracePeriodMs) {
            return false;
        }

        const context = {
            localParticipant: this.room.localParticipant.identity,
            room: this.room.name,
            participant: participant.identity,
            trackSid: publication.trackSid,
            missingDuration,
        };

        // eslint-disable-next-line no-console
        console.warn('Detected missing inbound-rtp stats', context);
        this.reportError?.('E2eeRecoveryManager: Detected missing inbound-rtp stats', {
            level: 'warning',
            context,
        });

        this.firstSeenWithoutStats.delete(trackKey);
        void this.triggerAudioRecovery(publication, participant, 'audio-missing-stats');
        return true;
    };

    private checkAudioStalled = (tick: ReceiverStatsTick): boolean => {
        const { publication, participant, stats } = tick;

        if (!stats) {
            return false;
        }

        const trackKey = trackKeyOf(participant, publication);
        const packetsReceived: number = stats.packetsReceived ?? 0;
        const lastPackets = this.lastPacketCounts.get(trackKey) ?? 0;
        this.lastPacketCounts.set(trackKey, packetsReceived);

        if (this.recoveryAttempts.has(trackKey)) {
            this.recoveryPacketProgress.set(trackKey, packetsReceived > lastPackets);
        }

        if (lastPackets <= 0 || packetsReceived !== lastPackets) {
            return false;
        }

        if (publication.track?.mediaStreamTrack?.readyState !== 'live') {
            return false;
        }

        const unmutedSince = this.firstUnmutedTime.get(trackKey) ?? Date.now();
        const unmutedDuration = Date.now() - unmutedSince;
        if (unmutedDuration < this.tuning.unmutedGracePeriodMs) {
            return false;
        }

        const context = {
            localParticipant: this.room.localParticipant.identity,
            room: this.room.name,
            participant: participant.identity,
            trackSid: publication.trackSid,
            packetsReceived,
            lastPackets,
            unmutedDuration,
        };
        // eslint-disable-next-line no-console
        console.warn('Detected stalled audio', context);
        this.reportError?.('E2eeRecoveryManager: Detected stalled audio', {
            level: 'warning',
            context,
        });
        void this.triggerAudioRecovery(publication, participant, 'audio-stalled');
        return true;
    };

    private checkAudioConcealment = (tick: ReceiverStatsTick) => {
        const { publication, participant, stats } = tick;
        if (!stats) {
            return;
        }
        const trackKey = trackKeyOf(participant, publication);

        const packetsReceived: number = stats.packetsReceived ?? 0;
        const concealedSamples: number = stats.concealedSamples ?? 0;
        const totalSamplesReceived: number = stats.totalSamplesReceived ?? 0;
        const silentConcealedSamples: number = stats.silentConcealedSamples ?? 0;
        const concealmentEvents: number = stats.concealmentEvents ?? 0;

        if (totalSamplesReceived < this.tuning.concealmentMinSamples) {
            return;
        }

        const nonSilentConcealedSamples = concealedSamples - silentConcealedSamples;
        const nonSilentConcealmentRatio = nonSilentConcealedSamples / totalSamplesReceived;

        const previous = this.lastConcealmentStats.get(trackKey);
        let recentNonSilentConcealmentRatio = 0;
        let hasRecentData = false;
        if (previous) {
            const newConcealedSamples = concealedSamples - previous.concealedSamples;
            const newSilentConcealedSamples = silentConcealedSamples - previous.silentConcealedSamples;
            const newNonSilentConcealedSamples = newConcealedSamples - newSilentConcealedSamples;
            const newTotalSamples = totalSamplesReceived - previous.totalSamplesReceived;
            if (newTotalSamples >= this.tuning.concealmentMinDeltaSamples) {
                recentNonSilentConcealmentRatio = newNonSilentConcealedSamples / newTotalSamples;
                hasRecentData = true;
            }
        }

        this.lastConcealmentStats.set(trackKey, {
            concealedSamples,
            silentConcealedSamples,
            totalSamplesReceived,
        });

        const recentConcealmentCritical =
            hasRecentData && recentNonSilentConcealmentRatio > this.tuning.recentConcealmentThreshold;
        const cumulativeConcealmentHigh = nonSilentConcealmentRatio > this.tuning.concealmentRatioThreshold;
        const attempts = this.recoveryAttempts.get(trackKey) ?? 0;
        const packetsAdvanced = this.recoveryPacketProgress.get(trackKey) ?? false;
        const recoveryReason = this.recoveryReasons.get(trackKey) ?? 'unknown';

        if (recentConcealmentCritical || cumulativeConcealmentHigh) {
            const consecutiveCount = (this.consecutiveHighConcealment.get(trackKey) ?? 0) + 1;
            this.consecutiveHighConcealment.set(trackKey, consecutiveCount);
            const shouldTrigger =
                recentConcealmentCritical || consecutiveCount >= this.tuning.concealmentConsecutiveHighTicks;
            if (!shouldTrigger) {
                return;
            }

            const context = {
                localParticipant: this.room.localParticipant.identity,
                room: this.room.name,
                participant: participant.identity,
                trackSid: publication.trackSid,
                nonSilentConcealmentRatio: nonSilentConcealmentRatio.toFixed(3),
                recentNonSilentConcealmentRatio: hasRecentData ? recentNonSilentConcealmentRatio.toFixed(3) : 'N/A',
                concealedSamples,
                silentConcealedSamples,
                nonSilentConcealedSamples,
                totalSamplesReceived,
                concealmentEvents,
                consecutiveChecks: consecutiveCount,
                triggerReason: recentConcealmentCritical ? 'recent_samples_critical' : 'cumulative_high',
            };
            this.resetRecoveryValidation(trackKey, {
                participant: participant.identity,
                trackSid: publication.trackSid,
                packetsReceived,
                packetsAdvanced,
                recoveryAttempts: attempts,
                recoveryReason,
            });
            // eslint-disable-next-line no-console
            console.warn('Detected high audio concealment', context);
            this.reportError?.('E2eeRecoveryManager: High audio concealment detected', {
                level: 'warning',
                context,
            });
            void this.triggerAudioRecovery(publication, participant, 'audio-concealment');
            return;
        }

        // Concealment is normal. If we previously kicked off a recovery for
        // this track, count this tick towards "successfully recovered".
        this.consecutiveHighConcealment.delete(trackKey);
        if (!this.recoveryAttempts.has(trackKey)) {
            return;
        }

        const validationContext = {
            localParticipant: this.room.localParticipant.identity,
            room: this.room.name,
            participant: participant.identity,
            trackSid: publication.trackSid,
            recoveryAttempts: attempts,
            recoveryReason,
            packetsReceived,
            packetsAdvanced,
            nonSilentConcealmentRatio: nonSilentConcealmentRatio.toFixed(3),
            recentNonSilentConcealmentRatio: hasRecentData ? recentNonSilentConcealmentRatio.toFixed(3) : 'N/A',
            concealedSamples,
            silentConcealedSamples,
            totalSamplesReceived,
            concealmentEvents,
        };

        if (!packetsAdvanced) {
            this.resetRecoveryValidation(trackKey, validationContext);
            return;
        }

        const healthyTicks = (this.recoveryHealthyTicks.get(trackKey) ?? 0) + 1;
        this.recoveryHealthyTicks.set(trackKey, healthyTicks);
        // eslint-disable-next-line no-console
        console.log('Recovery validation healthy tick', {
            trackKey,
            healthyTicks,
            requiredHealthyTicks: this.tuning.recoverySuccessTicks,
            ...validationContext,
        });

        if (healthyTicks >= this.tuning.recoverySuccessTicks) {
            const context = { ...validationContext, healthyTicks };
            // eslint-disable-next-line no-console
            console.log('Track recovered successfully', context);
            this.reportError?.('E2eeRecoveryManager: Track recovered successfully', {
                level: 'info',
                context,
            });
            this.cleanupTrackRecoveryState(trackKey);
        }
    };

    private checkAudioPersistentNoise = (tick: ReceiverStatsTick) => {
        const { publication, participant, stats } = tick;
        if (!stats) {
            return;
        }
        const trackKey = trackKeyOf(participant, publication);

        const totalAudioEnergy: number = stats.totalAudioEnergy ?? 0;
        const totalSamplesReceived: number = stats.totalSamplesReceived ?? 0;
        const audioLevel: number = stats.audioLevel ?? 0;

        const previous = this.lastEnergyStats.get(trackKey);
        this.lastEnergyStats.set(trackKey, { totalAudioEnergy, totalSamplesReceived });

        if (!previous) {
            return;
        }

        const energyDelta = totalAudioEnergy - previous.totalAudioEnergy;
        const samplesDelta = totalSamplesReceived - previous.totalSamplesReceived;
        if (energyDelta < 0 || samplesDelta <= 0) {
            this.consecutiveNoiseTicks.delete(trackKey);
            return;
        }

        const energyPerSample = energyDelta / samplesDelta;
        const isNoiseTick =
            energyPerSample > this.tuning.noiseEnergyPerSampleThreshold &&
            audioLevel >= this.tuning.noiseAudioLevelMinThreshold;

        if (!isNoiseTick) {
            this.consecutiveNoiseTicks.delete(trackKey);
            return;
        }

        const consecutive = (this.consecutiveNoiseTicks.get(trackKey) ?? 0) + 1;
        this.consecutiveNoiseTicks.set(trackKey, consecutive);
        if (consecutive < this.tuning.noiseConsecutiveTicks) {
            return;
        }

        const context = {
            localParticipant: this.room.localParticipant.identity,
            room: this.room.name,
            participant: participant.identity,
            trackSid: publication.trackSid,
            consecutiveTicks: consecutive,
            energyPerSample: energyPerSample.toExponential(3),
            audioLevel: audioLevel.toFixed(3),
            totalAudioEnergy: totalAudioEnergy.toFixed(3),
            totalSamplesReceived,
        };
        // eslint-disable-next-line no-console
        console.warn('Detected persistent audio noise (likely broken cryptor)', context);
        this.reportError?.('E2eeRecoveryManager: Detected persistent audio noise', {
            level: 'warning',
            context,
        });
        this.consecutiveNoiseTicks.delete(trackKey);
        void this.triggerAudioRecovery(publication, participant, 'audio-persistent-noise');
    };

    private handleEncryptionError = (error: Error, participant?: Participant | undefined) => {
        if (!participant) {
            // eslint-disable-next-line no-console
            console.warn('E2eeRecoveryManager: EncryptionError without participant', {
                errorName: error.name,
                errorMessage: error.message,
            });
            return;
        }

        const identity = participant.identity;
        const existing = this.pendingEncryptionRecoveryTimers.get(identity);
        // eslint-disable-next-line no-console
        console.warn('E2eeRecoveryManager: EncryptionError received', {
            identity,
            participantSid: participant.sid,
            errorName: error.name,
            errorMessage: error.message,
            hadPendingRecovery: Boolean(existing),
        });
        if (existing) {
            clearTimeout(existing);
        }

        const timer = setTimeout(() => {
            this.pendingEncryptionRecoveryTimers.delete(identity);
            const stillPresent = this.findParticipantByIdentity(identity);
            if (stillPresent) {
                void this.recoverParticipant(stillPresent, 'encryption-error');
            }
        }, this.tuning.encryptionErrorRecoveryDelayMs);
        this.pendingEncryptionRecoveryTimers.set(identity, timer);
    };

    private recoverParticipant = async (participant: RemoteParticipant, reason: RecoveryReason) => {
        const last = this.lastRecoverByParticipant.get(participant.identity) ?? 0;
        if (Date.now() - last < this.tuning.participantRecoverCooldownMs) {
            return;
        }
        this.lastRecoverByParticipant.set(participant.identity, Date.now());

        const videoPubs: RemoteTrackPublication[] = [];
        const audioPubs: RemoteTrackPublication[] = [];
        for (const pub of participant.trackPublications.values()) {
            const remotePub = pub as RemoteTrackPublication;
            if (remotePub.kind === Track.Kind.Video) {
                videoPubs.push(remotePub);
            } else if (remotePub.kind === Track.Kind.Audio && remotePub.source === Track.Source.Microphone) {
                audioPubs.push(remotePub);
            }
        }

        // eslint-disable-next-line no-console
        console.warn('E2eeRecoveryManager: recovering participant', {
            identity: participant.identity,
            participantSid: participant.sid,
            reason,
            videoTrackCount: videoPubs.length,
            audioTrackCount: audioPubs.length,
        });

        // Video recovery: short, simple in-place resubscribe.
        for (const pub of videoPubs) {
            try {
                pub.setSubscribed(false);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('E2eeRecoveryManager: video setSubscribed(false) failed', err);
            }
        }
        setTimeout(() => {
            for (const pub of videoPubs) {
                try {
                    pub.setSubscribed(true);
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.warn('E2eeRecoveryManager: video setSubscribed(true) failed', err);
                }
                this.videoStallState.delete(trackKeyOf(participant, pub));
            }
        }, 200);

        // Audio recovery: delegate to the subscription manager so it
        // coordinates with the cache and event guards.
        for (const pub of audioPubs) {
            void this.triggerAudioRecovery(pub, participant, reason);
        }
    };

    private triggerAudioRecovery = async (
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
        reason: RecoveryReason
    ) => {
        if (this.disabled) {
            return;
        }
        if (this.isRoomReconnecting) {
            // eslint-disable-next-line no-console
            console.log('E2eeRecoveryManager: skipping recovery, room is reconnecting');
            return;
        }
        if (
            participant.connectionQuality === ConnectionQuality.Poor ||
            participant.connectionQuality === ConnectionQuality.Lost ||
            this.room.localParticipant.connectionQuality === ConnectionQuality.Poor ||
            this.room.localParticipant.connectionQuality === ConnectionQuality.Lost
        ) {
            // eslint-disable-next-line no-console
            console.log('E2eeRecoveryManager: skipping recovery, connection quality poor', {
                participant: participant.identity,
                trackSid: publication.trackSid,
                participantQuality: participant.connectionQuality,
                localQuality: this.room.localParticipant.connectionQuality,
            });
            return;
        }

        const trackKey = trackKeyOf(participant, publication);
        if (this.audioManager.isRecovering(trackKey)) {
            return;
        }

        const attempts = this.recoveryAttempts.get(trackKey) ?? 0;
        if (attempts >= this.tuning.maxRecoveryAttempts) {
            const context = {
                localParticipant: this.room.localParticipant.identity,
                room: this.room.name,
                participant: participant.identity,
                trackSid: publication.trackSid,
                attempts,
            };
            // eslint-disable-next-line no-console
            console.error('E2eeRecoveryManager: Max recovery attempts reached', context);
            this.reportError?.('E2eeRecoveryManager: Max recovery attempts reached', {
                level: 'error',
                context,
            });
            return;
        }

        this.recoveryAttempts.set(trackKey, attempts + 1);
        this.recoveryReasons.set(trackKey, reason);
        this.recoveryHealthyTicks.set(trackKey, 0);
        this.recoveryPacketProgress.delete(trackKey);

        try {
            await this.audioManager.recoverTrack(publication, participant, reason);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('E2eeRecoveryManager: audio recoverTrack threw', error);
            this.reportError?.('E2eeRecoveryManager: audio recoverTrack threw', {
                level: 'error',
                context: { error, trackKey, participant: participant.identity, trackSid: publication.trackSid },
            });
            this.cleanupTrackRecoveryState(trackKey);
        }
    };

    private resetRecoveryValidation = (trackKey: string, context: Record<string, unknown>) => {
        const previous = this.recoveryHealthyTicks.get(trackKey) ?? 0;
        this.recoveryHealthyTicks.set(trackKey, 0);
        this.recoveryPacketProgress.delete(trackKey);
        if (previous > 0) {
            // eslint-disable-next-line no-console
            console.log('Recovery validation reset', {
                trackKey,
                previousHealthyTicks: previous,
                ...context,
            });
        }
    };

    private cleanupTrackRecoveryState = (trackKey: string) => {
        this.recoveryAttempts.delete(trackKey);
        this.recoveryReasons.delete(trackKey);
        this.recoveryHealthyTicks.delete(trackKey);
        this.recoveryPacketProgress.delete(trackKey);
        this.consecutiveHighConcealment.delete(trackKey);
        this.consecutiveNoiseTicks.delete(trackKey);
    };

    private findParticipantByIdentity = (identity: string): RemoteParticipant | undefined => {
        for (const participant of this.room.remoteParticipants.values()) {
            if (participant.identity === identity) {
                return participant;
            }
        }
        return undefined;
    };
}

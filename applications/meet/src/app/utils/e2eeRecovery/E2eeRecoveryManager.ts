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

interface EnergySnapshot {
    totalAudioEnergy: number;
    totalSamplesReceived: number;
}

const trackKeyOf = (participant: { sid: string }, publication: { trackSid: string }): string =>
    `${participant.sid}-${publication.trackSid}`;

/**
 * Coordinates detection and recovery of broken E2EE FrameCryptors. Polls
 * RTP stats on the configured tick interval and runs two independent detectors:
 *
 * - **video stall**: pktsRx grows but framesDecoded stays frozen. Almost
 *   always indicates a broken video cryptor. Also recovers the same
 *   participant's audio because the audio cryptor shares the same key state.
 * - **audio persistent noise**: corrupted cryptor producing continuous
 *   metallic noise — sustained high energy/sample ratio with no audioLevel
 *   dips. N consecutive quiet ticks after a recovery confirm the track is
 *   healed and reset the attempt counter.
 *
 * Also listens to {@link RoomEvent.EncryptionError} as an early signal
 * (rare in practice but free), with a join-time grace period to avoid
 * acting on the expected key-exchange burst when a new participant joins.
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
    private readonly tuning: E2eeRecoveryTuning;

    private tickInterval: NodeJS.Timeout | null = null;
    private summaryInterval: NodeJS.Timeout | null = null;
    private isTickRunning = false;
    private isRoomReconnecting = false;

    // Timestamp of the last ConnectionState.Connected event. null before the
    // first connection. Used to suppress encryption-error recovery during the
    // join-time (and reconnect) key-exchange window.
    private connectedAt: number | null = null;

    private videoStallState = new Map<string, VideoStallState>();
    private lastEnergyStats = new Map<string, EnergySnapshot>();
    private consecutiveNoiseTicks = new Map<string, number>();
    // Counts consecutive ticks with normal energy/sample after a recovery.
    // When this reaches recoverySuccessTicks the track is considered healed.
    private consecutiveQuietTicks = new Map<string, number>();

    // Per-track recovery accounting. recoveryAttempts only clears when a
    // track is validated as recovered or the participant disconnects.
    private recoveryAttempts = new Map<string, number>();

    // Per-participant cooldowns and pending encryption-error timers.
    private lastRecoverByParticipant = new Map<string, number>();
    private pendingEncryptionRecoveryTimers = new Map<string, NodeJS.Timeout>();

    // Session-level counters flushed to Sentry every 5 minutes and on cleanup.
    private sessionNoiseDetections = 0;
    private sessionRecoveryAttempts = 0;
    private sessionSuccessfulRecoveries = 0;
    private sessionAffectedTrackKeys = new Set<string>();
    private sessionRecoveryReasons: Partial<Record<RecoveryReason, number>> = {};

    constructor({
        room,
        audioManager,
        reportError,
        disabled = false,
        tuning = E2EE_RECOVERY_TUNING_DEFAULT,
    }: E2eeRecoveryManagerOptions) {
        this.room = room;
        this.audioManager = audioManager;
        this.reportError = reportError;
        this.disabled = disabled;
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

        this.summaryInterval = setInterval(
            () => {
                this.flushSessionSummary();
                this.resetSessionCounters();
            },
            5 * 60 * 1_000
        );
    };

    cleanup = () => {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }

        if (this.summaryInterval) {
            clearInterval(this.summaryInterval);
            this.summaryInterval = null;
        }

        this.pendingEncryptionRecoveryTimers.forEach((timer) => clearTimeout(timer));
        this.pendingEncryptionRecoveryTimers.clear();

        this.room.off(RoomEvent.EncryptionError, this.handleEncryptionError);
        this.room.off(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged);
        this.room.off(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);

        this.videoStallState.clear();
        this.lastEnergyStats.clear();
        this.consecutiveNoiseTicks.clear();
        this.consecutiveQuietTicks.clear();
        this.recoveryAttempts.clear();
        this.lastRecoverByParticipant.clear();

        this.flushSessionSummary();
        this.resetSessionCounters();
    };

    private handleConnectionStateChanged = (state: ConnectionState) => {
        if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
            this.isRoomReconnecting = true;
        } else if (state === ConnectionState.Connected) {
            this.isRoomReconnecting = false;
            // Reset the grace-period clock on every connection (initial join and
            // reconnects both trigger key-exchange bursts that should be suppressed).
            this.connectedAt = Date.now();
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
        removeIfMatching(this.lastEnergyStats);
        removeIfMatching(this.consecutiveNoiseTicks);
        removeIfMatching(this.consecutiveQuietTicks);
        removeIfMatching(this.recoveryAttempts);

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

        if (publication.isMuted) {
            const trackKey = trackKeyOf(tick.participant, publication);
            this.lastEnergyStats.delete(trackKey);
            this.consecutiveNoiseTicks.delete(trackKey);
            this.consecutiveQuietTicks.delete(trackKey);
            return;
        }

        if (!publication.isSubscribed || !publication.track) {
            return;
        }

        const trackKey = trackKeyOf(tick.participant, publication);

        // While the unsubscribe/subscribe dance is running we don't trust
        // energy counters and we don't fire new detections. Clear baselines
        // so the next subscription starts fresh.
        if (this.audioManager.isRecovering(trackKey)) {
            this.lastEnergyStats.delete(trackKey);
            this.consecutiveNoiseTicks.delete(trackKey);
            this.consecutiveQuietTicks.delete(trackKey);
            return;
        }

        if (!tick.stats) {
            return;
        }

        this.checkAudioPersistentNoise(tick);
    };

    /**
     * Detects a corrupted E2EE FrameCryptor producing continuous metallic noise by
     * measuring energy per decoded sample over consecutive ticks. When the ratio stays
     * above {@link E2eeRecoveryTuning.noiseEnergyPerSampleThreshold} for
     * {@link E2eeRecoveryTuning.noiseConsecutiveTicks} ticks in a row, recovery is
     * triggered. Conversely, {@link E2eeRecoveryTuning.recoverySuccessTicks} consecutive
     * quiet ticks after a recovery confirm the track is healed.
     */
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
            // No new samples this tick — no signal in either direction.
            this.consecutiveNoiseTicks.delete(trackKey);
            this.consecutiveQuietTicks.delete(trackKey);
            return;
        }

        const energyPerSample = energyDelta / samplesDelta;
        const isNoiseTick =
            energyPerSample > this.tuning.noiseEnergyPerSampleThreshold &&
            audioLevel >= this.tuning.noiseAudioLevelMinThreshold;

        if (!isNoiseTick) {
            this.consecutiveNoiseTicks.delete(trackKey);

            // Count quiet ticks toward recovery success validation.
            if (this.recoveryAttempts.has(trackKey)) {
                const quietTicks = (this.consecutiveQuietTicks.get(trackKey) ?? 0) + 1;
                this.consecutiveQuietTicks.set(trackKey, quietTicks);

                if (quietTicks >= this.tuning.recoverySuccessTicks) {
                    // eslint-disable-next-line no-console
                    console.log('E2eeRecoveryManager: Track recovered successfully', {
                        localParticipant: this.room.localParticipant.identity,
                        room: this.room.name,
                        participant: participant.identity,
                        trackSid: publication.trackSid,
                        recoveryAttempts: this.recoveryAttempts.get(trackKey),
                        quietTicks,
                    });
                    this.sessionSuccessfulRecoveries += 1;
                    this.cleanupTrackRecoveryState(trackKey);
                }
            }
            return;
        }

        // Noise tick detected — reset quiet counter and advance noise counter.
        this.consecutiveQuietTicks.delete(trackKey);
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
        console.warn('E2eeRecoveryManager: Detected persistent audio noise (likely broken cryptor)', context);
        this.sessionNoiseDetections += 1;
        this.sessionAffectedTrackKeys.add(trackKey);
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
        const timeSinceConnected = this.connectedAt !== null ? Date.now() - this.connectedAt : null;
        const inJoinGrace = timeSinceConnected === null || timeSinceConnected < this.tuning.joinGracePeriodMs;

        // eslint-disable-next-line no-console
        console.warn('E2eeRecoveryManager: EncryptionError received', {
            identity,
            participantSid: participant.sid,
            errorName: error.name,
            errorMessage: error.message,
            timeSinceConnected,
            inJoinGrace,
        });

        // During the join-time key-exchange window all remote participants emit
        // EncryptionErrors simultaneously — the FrameCryptors start receiving frames
        // before keys are distributed. Recovering at this point interrupts key
        // negotiation and triggers a cascade of noise detections. We log the event
        // but defer acting on it until the grace period has elapsed.
        if (inJoinGrace) {
            // eslint-disable-next-line no-console
            console.log('E2eeRecoveryManager: skipping encryption-error recovery, within join grace period', {
                identity,
                timeSinceConnected,
                joinGracePeriodMs: this.tuning.joinGracePeriodMs,
            });
            return;
        }

        const existing = this.pendingEncryptionRecoveryTimers.get(identity);
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
        this.consecutiveQuietTicks.delete(trackKey);
        this.sessionRecoveryAttempts += 1;
        this.sessionRecoveryReasons[reason] = (this.sessionRecoveryReasons[reason] ?? 0) + 1;

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

    private cleanupTrackRecoveryState = (trackKey: string) => {
        this.recoveryAttempts.delete(trackKey);
        this.consecutiveNoiseTicks.delete(trackKey);
        this.consecutiveQuietTicks.delete(trackKey);
    };

    private flushSessionSummary = () => {
        if (this.sessionNoiseDetections === 0) {
            return;
        }
        const summary = {
            localParticipant: this.room.localParticipant.identity,
            room: this.room.name,
            noiseDetections: this.sessionNoiseDetections,
            recoveryAttempts: this.sessionRecoveryAttempts,
            successfulRecoveries: this.sessionSuccessfulRecoveries,
            affectedTracks: this.sessionAffectedTrackKeys.size,
            reasons: { ...this.sessionRecoveryReasons },
        };
        // eslint-disable-next-line no-console
        console.log('E2eeRecoveryManager: Session summary', summary);
        this.reportError?.('E2eeRecoveryManager: Session noise summary', {
            level: 'warning',
            context: summary,
        });
    };

    private resetSessionCounters = () => {
        this.sessionNoiseDetections = 0;
        this.sessionRecoveryAttempts = 0;
        this.sessionSuccessfulRecoveries = 0;
        this.sessionAffectedTrackKeys.clear();
        this.sessionRecoveryReasons = {};
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

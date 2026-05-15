/**
 * Tunable parameters for {@link E2eeRecoveryManager}. Use {@link E2EE_RECOVERY_TUNING_DEFAULT}
 * for production behaviour; use {@link E2EE_RECOVERY_TUNING_AGGRESSIVE} for faster / more
 * sensitive recovery at the cost of more false positives.
 */

export type E2eeRecoveryProfile = 'default' | 'aggressive';

export interface E2eeRecoveryTuning {
    /** How often we read inbound-rtp stats (ms between checks). */
    tickIntervalMs: number;
    /** Give up on resubscribe / recovery after this many tries (per track). */
    maxRecoveryAttempts: number;
    /** Don't run another recovery on the same participant until this many ms passed. */
    participantRecoverCooldownMs: number;
    /** Number of ticks in a row that must look "stuck" before we treat video as broken. */
    videoStuckTicksThreshold: number;
    /** If packets went up by at least this much since last tick… */
    videoPktsDeltaMin: number;
    /** …but decoded frames barely moved, we treat that as stuck video (codec / E2EE path). */
    videoFramesDeltaMin: number;
    /**
     * How many consecutive ticks of normal energy/sample ratio are needed after a recovery
     * before we consider the audio track successfully healed and reset the attempt counter.
     */
    recoverySuccessTicks: number;
    /** Audio energy per sample above this threshold points to sustained garbage noise vs speech. */
    noiseEnergyPerSampleThreshold: number;
    /** Noise detector also requires audio level at least this high (together with energy above). */
    noiseAudioLevelMinThreshold: number;
    /** Must hit both noise thresholds this many ticks in a row before we call it broken crypto audio. */
    noiseConsecutiveTicks: number;
}

/** Values calibrated against captured RTP traces in production-like sessions. */
export const E2EE_RECOVERY_TUNING_DEFAULT: E2eeRecoveryTuning = {
    tickIntervalMs: 2_000,
    maxRecoveryAttempts: 3,
    participantRecoverCooldownMs: 8_000,
    videoStuckTicksThreshold: 3,
    videoPktsDeltaMin: 20,
    videoFramesDeltaMin: 2,
    recoverySuccessTicks: 3,
    noiseEnergyPerSampleThreshold: 3e-6,
    noiseAudioLevelMinThreshold: 0.05,
    noiseConsecutiveTicks: 4,
};

/**
 * Shorter grace periods, lower thresholds, faster encryption debounce, more recovery attempts.
 */
export const E2EE_RECOVERY_TUNING_AGGRESSIVE: E2eeRecoveryTuning = {
    ...E2EE_RECOVERY_TUNING_DEFAULT,
    tickIntervalMs: 1_500,
    maxRecoveryAttempts: 5,
    participantRecoverCooldownMs: 4_000,
    videoStuckTicksThreshold: 2,
    videoPktsDeltaMin: 15,
    videoFramesDeltaMin: 1,
    recoverySuccessTicks: 2,
    noiseEnergyPerSampleThreshold: 2.5e-6,
    noiseAudioLevelMinThreshold: 0.04,
    noiseConsecutiveTicks: 3,
};

export const getE2eeRecoveryTuning = (profile: E2eeRecoveryProfile): E2eeRecoveryTuning =>
    profile === 'aggressive' ? E2EE_RECOVERY_TUNING_AGGRESSIVE : E2EE_RECOVERY_TUNING_DEFAULT;

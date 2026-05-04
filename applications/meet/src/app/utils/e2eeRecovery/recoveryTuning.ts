/**
 * Tunable parameters for {@link E2eeRecoveryManager}. Use {@link E2EE_RECOVERY_TUNING_DEFAULT}
 * for production behaviour that matches the historic calibration; use {@link E2EE_RECOVERY_TUNING_AGGRESSIVE}
 * when you want faster / more sensitive recovery at the cost of more false positives.
 */

export type E2eeRecoveryProfile = 'default' | 'aggressive';

export interface E2eeRecoveryTuning {
    /** How often we read inbound-rtp stats (ms between checks). */
    tickIntervalMs: number;
    /** Give up on resubscribe / recovery after this many tries (per track). */
    maxRecoveryAttempts: number;
    /** Don’t run another recovery on the same participant until this many ms passed. */
    participantRecoverCooldownMs: number;
    /** Number of ticks in a row that must look “stuck” before we treat video as broken. */
    videoStuckTicksThreshold: number;
    /** If packets went up by at least this much since last tick… */
    videoPktsDeltaMin: number;
    /** …but decoded frames barely moved, we treat that as stuck video (codec / E2EE path). */
    videoFramesDeltaMin: number;
    /** If stats are missing for less than this, don’t panic (short gaps are normal). */
    missingStatsGracePeriodMs: number;
    /** After unmute, skip audio-quality checks until this passes (levels settle). */
    unmutedGracePeriodMs: number;
    /** Long-run fraction of concealed audio above this → likely ongoing audio trouble. */
    concealmentRatioThreshold: number;
    /** Same idea but only on recent audio window (catch active breakage faster). */
    recentConcealmentThreshold: number;
    /** Need at least this many decoded samples before concealment ratios mean anything. */
    concealmentMinSamples: number;
    /** Need at least this many new samples in one tick before delta checks are valid. */
    concealmentMinDeltaSamples: number;
    /**
     * High concealment must persist this many ticks (unless the “recent window” is already critical)
     * before we trigger recovery. Lower = more aggressive.
     */
    concealmentConsecutiveHighTicks: number;
    /** How many ticks in a row things must look healthy before we clear “recovering” state. */
    recoverySuccessTicks: number;
    /** Wait this long after Room encryption errors before recovery runs (debounce). */
    encryptionErrorRecoveryDelayMs: number;
    /** Audio energy per sample above this points to sustained garbage noise vs speech. */
    noiseEnergyPerSampleThreshold: number;
    /** Noise detector also needs audio level at least this high (together with energy above). */
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
    missingStatsGracePeriodMs: 5_000,
    unmutedGracePeriodMs: 4_000,
    concealmentRatioThreshold: 0.15,
    recentConcealmentThreshold: 0.25,
    concealmentMinSamples: 1_000,
    concealmentMinDeltaSamples: 500,
    concealmentConsecutiveHighTicks: 2,
    recoverySuccessTicks: 2,
    encryptionErrorRecoveryDelayMs: 1_500,
    noiseEnergyPerSampleThreshold: 3e-6,
    noiseAudioLevelMinThreshold: 0.05,
    noiseConsecutiveTicks: 4,
};

/**
 * Shorter grace periods, lower ratio thresholds, faster encryption debounce, more recovery attempts.
 */
export const E2EE_RECOVERY_TUNING_AGGRESSIVE: E2eeRecoveryTuning = {
    ...E2EE_RECOVERY_TUNING_DEFAULT,
    tickIntervalMs: 1_500,
    maxRecoveryAttempts: 5,
    participantRecoverCooldownMs: 4_000,
    videoStuckTicksThreshold: 2,
    videoPktsDeltaMin: 15,
    videoFramesDeltaMin: 1,
    missingStatsGracePeriodMs: 3_000,
    unmutedGracePeriodMs: 2_500,
    concealmentRatioThreshold: 0.12,
    recentConcealmentThreshold: 0.18,
    concealmentMinSamples: 700,
    concealmentMinDeltaSamples: 350,
    concealmentConsecutiveHighTicks: 1,
    recoverySuccessTicks: 2,
    encryptionErrorRecoveryDelayMs: 800,
    noiseEnergyPerSampleThreshold: 2.5e-6,
    noiseAudioLevelMinThreshold: 0.04,
    noiseConsecutiveTicks: 3,
};

export const getE2eeRecoveryTuning = (profile: E2eeRecoveryProfile): E2eeRecoveryTuning =>
    profile === 'aggressive' ? E2EE_RECOVERY_TUNING_AGGRESSIVE : E2EE_RECOVERY_TUNING_DEFAULT;

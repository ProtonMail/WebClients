import { describe, expect, it } from 'vitest';

import { E2EE_RECOVERY_TUNING_AGGRESSIVE, E2EE_RECOVERY_TUNING_DEFAULT, getE2eeRecoveryTuning } from './recoveryTuning';

describe('recoveryTuning', () => {
    it('returns default preset for profile default', () => {
        expect(getE2eeRecoveryTuning('default')).toBe(E2EE_RECOVERY_TUNING_DEFAULT);
    });

    it('returns aggressive preset with shorter cooldown and lower concealment bar', () => {
        const a = E2EE_RECOVERY_TUNING_AGGRESSIVE;
        const d = E2EE_RECOVERY_TUNING_DEFAULT;
        expect(getE2eeRecoveryTuning('aggressive')).toBe(a);
        expect(a.participantRecoverCooldownMs).toBeLessThan(d.participantRecoverCooldownMs);
        expect(a.concealmentRatioThreshold).toBeLessThan(d.concealmentRatioThreshold);
        expect(a.tickIntervalMs).toBeLessThan(d.tickIntervalMs);
        expect(a.maxRecoveryAttempts).toBeGreaterThan(d.maxRecoveryAttempts);
    });
});

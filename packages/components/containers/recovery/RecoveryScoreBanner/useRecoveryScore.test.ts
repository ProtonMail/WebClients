import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';

import { calculateRecoveryScore } from './useRecoveryScore';
import type { RecoveryScoreState } from './useRecoveryScore';

const baseSecurityState: SecurityState = {
    phrase: { isAvailable: false, isSet: false, isOutdated: false },
    email: { value: 'user@example.com', isEnabled: true, verified: true },
    phone: { value: '+10000000000', isEnabled: true, verified: true },
    deviceRecovery: { isAvailable: false, isEnabled: false },
    hasSentinelEnabled: false,
};

const baseState: RecoveryScoreState = {
    securityState: baseSecurityState,
    recoveryFile: { isAvailable: false, isEnabled: false },
    recoveryContacts: { isAvailable: false, isEnabled: false },
    signedInReset: { isAvailable: false, isEnabled: false },
    qrCodeSignIn: { isAvailable: true, isEnabled: true },
    emergencyContacts: { isAvailable: true, isEnabled: true },
};

describe('calculateRecoveryScore', () => {
    /**
     * Recovery contacts (SocialRecovery) are only counted when the flag is on and the user has
     * delegated/emergency access. When the feature is off, that criterion is excluded so the max
     * denominator does not include recovery contacts yet.
     */
    it('excludes recovery contacts from the score when SocialRecovery is disabled', () => {
        const { score, maxScore } = calculateRecoveryScore(baseState);

        // email, phone, qrCodeSignIn, emergencyContacts, passwordVerification → 5
        expect(score).toBe(5);
        expect(maxScore).toBe(10);
    });

    it('adds recovery contacts to the denominator when SocialRecovery is on but none are set yet', () => {
        const state: RecoveryScoreState = {
            ...baseState,
            recoveryContacts: { isAvailable: true, isEnabled: false },
        };

        const { score } = calculateRecoveryScore(state);

        // email, phone, qrCodeSignIn, emergencyContacts, passwordVerification enabled; recoveryContacts available but not set → 5
        expect(score).toBe(5);
    });

    it('counts recovery contacts as enabled when SocialRecovery is on and contacts exist', () => {
        const state: RecoveryScoreState = {
            ...baseState,
            recoveryContacts: { isAvailable: true, isEnabled: true },
        };

        const { score } = calculateRecoveryScore(state);

        // email, phone, recoveryContacts, qrCodeSignIn, emergencyContacts, passwordVerification → 6
        expect(score).toBe(6);
    });

    it('scores weakly when only recovery email is configured (phone, QR, emergency off)', () => {
        const state: RecoveryScoreState = {
            ...baseState,
            securityState: {
                ...baseSecurityState,
                phone: { value: '', isEnabled: false, verified: false },
            },
            qrCodeSignIn: { isAvailable: true, isEnabled: false },
            emergencyContacts: { isAvailable: false, isEnabled: false },
        };

        const { score } = calculateRecoveryScore(state);

        // email, passwordVerification enabled; phone/qr/emergency off → 2
        expect(score).toBe(2);
    });

    it('returns MIN_SCORE when neither email nor phone is enabled, regardless of other items', () => {
        const state: RecoveryScoreState = {
            ...baseState,
            securityState: {
                ...baseSecurityState,
                email: { value: '', isEnabled: false, verified: false },
                phone: { value: '', isEnabled: false, verified: false },
            },
        };

        const { score } = calculateRecoveryScore(state);

        // qrCodeSignIn, emergencyContacts, passwordVerification still count; deviceRecovery/recoveryFile/recoveryContacts gated → 3
        expect(score).toBe(3);
    });
});

import type { RecoveryItem, RecoveryItems } from '../recoveryState/recoveryState';
import { calculateRecoveryScore } from './calculateRecoveryScore';

const makeBaseItems = (overrides: Partial<RecoveryItem>[] = []): RecoveryItems => {
    const defaults: RecoveryItems = [
        { id: 'passwordVerification', isAvailable: false, isEnabled: false },
        {
            id: 'recoveryEmail',
            isAvailable: true,
            isEnabled: true,
            data: { isVerified: true, hasValue: true, hasReset: true, value: 'foo@bar.com' },
            countsTowardScore: true,
        },
        {
            id: 'recoveryPhone',
            isAvailable: true,
            isEnabled: true,
            data: { isVerified: true, hasValue: true, hasReset: true, value: 'foo@bar.com' },
            countsTowardScore: true,
        },
        { id: 'deviceRecovery', isAvailable: true, isEnabled: false, countsTowardScore: true },
        { id: 'recoveryContacts', isAvailable: false, isEnabled: false },
        { id: 'recoveryPhrase', isAvailable: true, isEnabled: false },
        { id: 'signedInReset', isAvailable: true, isEnabled: false },
        { id: 'qrCodeSignIn', isAvailable: true, isEnabled: true },
        { id: 'recoveryFile', isAvailable: true, isEnabled: false, countsTowardScore: true },
        { id: 'emergencyContacts', isAvailable: true, isEnabled: true },
    ];
    return defaults.map((item) => {
        const override = overrides.find((o) => o.id === item.id);
        return override ? { ...item, ...override } : item;
    }) as RecoveryItems;
};

describe('calculateRecoveryScore', () => {
    /**
     * Recovery contacts (SocialRecovery) are only counted when the feature is available to the user.
     * When not available, that criterion is excluded so it doesn't affect the score.
     */
    it('excludes recovery contacts from the score when not available', () => {
        const { score, maxScore } = calculateRecoveryScore(makeBaseItems());

        // email, phone, qrCodeSignIn, emergencyContacts → 4
        expect(score).toBe(4);
        expect(maxScore).toBe(10);
    });

    it('does not increase score when recovery contacts are available but not enabled', () => {
        const { score } = calculateRecoveryScore(
            makeBaseItems([{ id: 'recoveryContacts', isAvailable: true, isEnabled: false }])
        );

        // email, phone, qrCodeSignIn, emergencyContacts; recoveryContacts available but not set → 4
        expect(score).toBe(4);
    });

    it('counts recovery contacts when available and enabled', () => {
        const { score } = calculateRecoveryScore(
            makeBaseItems([{ id: 'recoveryContacts', isAvailable: true, isEnabled: true }])
        );

        // email, phone, recoveryContacts, qrCodeSignIn, emergencyContacts → 5
        expect(score).toBe(5);
    });

    it('scores weakly when only recovery email is configured', () => {
        const { score } = calculateRecoveryScore(
            makeBaseItems([
                {
                    id: 'recoveryPhone',
                    isEnabled: false,
                    data: { hasValue: false, isVerified: false, hasReset: false, value: '' },
                },
                { id: 'qrCodeSignIn', isEnabled: false },
                { id: 'emergencyContacts', isAvailable: false, isEnabled: false },
            ])
        );

        // email only → 1
        expect(score).toBe(1);
    });

    it('excludes gated items from the score when neither email nor phone is enabled', () => {
        const { score } = calculateRecoveryScore(
            makeBaseItems([
                {
                    id: 'recoveryEmail',
                    isEnabled: false,
                    data: { hasValue: false, isVerified: false, hasReset: false, value: '' },
                    countsTowardScore: false,
                },
                {
                    id: 'recoveryPhone',
                    isEnabled: false,
                    data: { hasValue: false, isVerified: false, hasReset: false, value: '' },
                    countsTowardScore: false,
                },
                { id: 'deviceRecovery', isEnabled: true, countsTowardScore: false },
                { id: 'recoveryFile', isEnabled: true, countsTowardScore: false },
            ])
        );

        // qrCodeSignIn, emergencyContacts; email/phone/deviceRecovery/recoveryFile gated → 2
        expect(score).toBe(2);
    });
});

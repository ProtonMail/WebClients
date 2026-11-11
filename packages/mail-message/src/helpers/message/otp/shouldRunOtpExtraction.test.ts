import {
    OTP_MAX_AGE_MS,
    OtpGateSource,
    getOtpGate,
    getOtpGateSource,
    isRecentEmail,
    shouldRunOtpExtraction,
} from './shouldRunOtpExtraction';

const NOW = 1_700_000_000_000;

describe('isRecentEmail', () => {
    it('is true for an email within the max-age window', () => {
        expect(isRecentEmail(NOW - (OTP_MAX_AGE_MS - 1), NOW)).toBe(true);
    });

    it('is false at or beyond the max-age window', () => {
        expect(isRecentEmail(NOW - OTP_MAX_AGE_MS, NOW)).toBe(false);
        expect(isRecentEmail(NOW - 2 * OTP_MAX_AGE_MS, NOW)).toBe(false);
    });

    it('is false for an unset timestamp', () => {
        expect(isRecentEmail(0, NOW)).toBe(false);
    });
});

describe('shouldRunOtpExtraction', () => {
    const recent = NOW - 60_000; // 1 minute ago
    const stale = NOW - (OTP_MAX_AGE_MS + 60_000);

    it('runs for a recent OTP subject', () => {
        expect(shouldRunOtpExtraction({ subject: 'Your code is 531631', timestampMs: recent }, NOW)).toBe(true);
    });

    it('does not run for a recent non-OTP subject', () => {
        expect(shouldRunOtpExtraction({ subject: 'Lunch tomorrow?', timestampMs: recent }, NOW)).toBe(false);
    });

    it('does not run for a stale OTP subject', () => {
        expect(shouldRunOtpExtraction({ subject: 'Your code is 531631', timestampMs: stale }, NOW)).toBe(false);
    });

    it('uses the sender to gain brand-in-sender recall', () => {
        expect(
            shouldRunOtpExtraction(
                { subject: 'Your Spotify code', sender: 'no-reply@spotify.com', timestampMs: recent },
                NOW
            )
        ).toBe(true);
        expect(
            shouldRunOtpExtraction(
                { subject: 'Your Spotify code', sender: 'security@acme.com', timestampMs: recent },
                NOW
            )
        ).toBe(false);
    });

    it('runs for a recent flagged email whose subject is not an OTP subject', () => {
        expect(
            shouldRunOtpExtraction(
                { subject: 'Lunch tomorrow?', isThirdPartyRegistration: true, timestampMs: recent },
                NOW
            )
        ).toBe(true);
    });

    it('does not run for a recent unflagged email whose subject is not an OTP subject', () => {
        expect(
            shouldRunOtpExtraction(
                { subject: 'Lunch tomorrow?', isThirdPartyRegistration: false, timestampMs: recent },
                NOW
            )
        ).toBe(false);
    });

    it('does not run for a stale flagged email', () => {
        expect(
            shouldRunOtpExtraction(
                { subject: 'Lunch tomorrow?', isThirdPartyRegistration: true, timestampMs: stale },
                NOW
            )
        ).toBe(false);
    });
});

describe('getOtpGateSource', () => {
    it('is subject for an OTP subject without the flag', () => {
        expect(getOtpGateSource({ subject: 'Your code is 531631', isThirdPartyRegistration: false })).toBe(
            OtpGateSource.SUBJECT
        );
    });

    it('is third_party_registration for a flagged email whose subject is not an OTP subject', () => {
        expect(getOtpGateSource({ subject: 'Lunch tomorrow?', isThirdPartyRegistration: true })).toBe(
            OtpGateSource.THIRD_PARTY_REGISTRATION
        );
    });

    it('is both for a flagged email with an OTP subject', () => {
        expect(getOtpGateSource({ subject: 'Your code is 531631', isThirdPartyRegistration: true })).toBe(
            OtpGateSource.BOTH
        );
    });

    it('is null when neither the subject nor the flag passes', () => {
        expect(getOtpGateSource({ subject: 'Lunch tomorrow?', isThirdPartyRegistration: false })).toBeNull();
    });

    it('uses the sender for brand-in-sender recall', () => {
        expect(getOtpGateSource({ subject: 'Your Spotify code', sender: 'no-reply@spotify.com' })).toBe(
            OtpGateSource.SUBJECT
        );
        expect(getOtpGateSource({ subject: 'Your Spotify code', sender: 'security@acme.com' })).toBeNull();
    });
});

describe('getOtpGate', () => {
    const recent = NOW - 60_000;
    const stale = NOW - (OTP_MAX_AGE_MS + 60_000);
    const flaggedOtpEmail = { subject: 'Your code is 531631', isThirdPartyRegistration: true };

    it('returns the gate source for a recent email that passes the gate', () => {
        expect(getOtpGate(flaggedOtpEmail, recent, NOW)).toBe(OtpGateSource.BOTH);
    });

    it('is null for a stale email, even one passing both halves', () => {
        expect(getOtpGate(flaggedOtpEmail, stale, NOW)).toBeNull();
    });
});

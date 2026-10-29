import { OTP_MAX_AGE_MS, isRecentEmail, shouldRunOtpExtraction } from './shouldRunOtpExtraction';

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
});

import { isOtpSubject } from './isOtpSubject';

// One-time-code extraction only runs on very recent mail: a genuine OTP is
// acted on within minutes of arrival, so anything older is almost never one.
export const OTP_MAX_AGE_MS = 20 * 60 * 1000; // 20 minutes

interface OtpEmailMetadata {
    subject: string;
    /** The `From` address. Optional — adds brand-in-sender recall when present. */
    sender?: string;
    /** Email send time, epoch milliseconds. */
    timestampMs: number;
    /** Set by the backend categorisation model. */
    isThirdPartyRegistration?: boolean;
}

export const isRecentEmail = (timestampMs: number, now = Date.now()): boolean =>
    timestampMs > 0 && now - timestampMs < OTP_MAX_AGE_MS;

/**
 * Decide from metadata alone (subject, sender, time, backend flag), never the body,
 * whether one-time-code extraction should run for an email. True only when the email
 * is recent AND either the backend flagged it as a third-party registration or its
 * subject classifies as an OTP email.
 */
export const shouldRunOtpExtraction = (
    { subject, sender, timestampMs, isThirdPartyRegistration }: OtpEmailMetadata,
    now = Date.now()
): boolean => isRecentEmail(timestampMs, now) && (!!isThirdPartyRegistration || isOtpSubject(subject, sender));

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
}

export const isRecentEmail = (timestampMs: number, now = Date.now()): boolean =>
    timestampMs > 0 && now - timestampMs < OTP_MAX_AGE_MS;

/**
 * Decide — from metadata alone (subject, sender, time), never the body — whether
 * one-time-code extraction should run for an email. True only when the email is
 * recent AND its subject classifies as an OTP email.
 */
export const shouldRunOtpExtraction = ({ subject, sender, timestampMs }: OtpEmailMetadata, now = Date.now()): boolean =>
    isRecentEmail(timestampMs, now) && isOtpSubject(subject, sender);

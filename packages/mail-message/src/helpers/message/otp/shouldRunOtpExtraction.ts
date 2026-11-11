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

export enum OtpGateSource {
    SUBJECT = 'subject',
    THIRD_PARTY_REGISTRATION = 'third_party_registration',
    BOTH = 'both',
}

type OtpGateMetadata = Omit<OtpEmailMetadata, 'timestampMs'>;

/**
 * Which half of the gate an email passes: its subject, the backend flag, or both. Null when it
 * passes neither. Recency is not checked here; {@link getOtpGate} adds it.
 */
export const getOtpGateSource = ({
    subject,
    sender,
    isThirdPartyRegistration,
}: OtpGateMetadata): OtpGateSource | null => {
    const isSubjectMatch = isOtpSubject(subject, sender);

    if (isThirdPartyRegistration && isSubjectMatch) {
        return OtpGateSource.BOTH;
    }
    if (isThirdPartyRegistration) {
        return OtpGateSource.THIRD_PARTY_REGISTRATION;
    }
    if (isSubjectMatch) {
        return OtpGateSource.SUBJECT;
    }
    return null;
};

/**
 * Which half of the gate a recent email passes, or null when extraction should not run (the email
 * is stale, or passes neither half).
 */
export const getOtpGate = (metadata: OtpGateMetadata, timestampMs: number, now = Date.now()): OtpGateSource | null => {
    if (!isRecentEmail(timestampMs, now)) {
        return null;
    }
    return getOtpGateSource(metadata);
};

/**
 * Decide from metadata alone (subject, sender, time, backend flag), never the body,
 * whether one-time-code extraction should run for an email. True only when the email
 * is recent AND either the backend flagged it as a third-party registration or its
 * subject classifies as an OTP email.
 */
export const shouldRunOtpExtraction = ({ timestampMs, ...metadata }: OtpEmailMetadata, now = Date.now()): boolean =>
    getOtpGate(metadata, timestampMs, now) !== null;

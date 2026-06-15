import { MIME_TYPES } from '@proton/shared/lib/constants';

export type ContentKind = 'html' | 'plain';

export interface OneTimeCodeInput {
    subject: string;
    body: string;
    mimeType: MIME_TYPES;
    /** Unix seconds — used to derive the date blacklist so the email's own date is not mistaken for an OTP. */
    timestamp: number;
}

export interface NormalizedEmail {
    subject: string;
    body: string;
    kind: ContentKind;
    timestamp: number;
}

/**
 * Normalize a production OTP input into the shape the extractors consume. The
 * subject is NFKC-normalized; the content kind is derived from the MIME type.
 * Forwarded-email stripping is intentionally not performed here (out of scope).
 */
export function normalize({ subject, body, mimeType, timestamp }: OneTimeCodeInput): NormalizedEmail {
    return {
        subject: (subject || '').normalize('NFKC'),
        body: body || '',
        kind: mimeType === MIME_TYPES.PLAINTEXT ? 'plain' : 'html',
        timestamp,
    };
}

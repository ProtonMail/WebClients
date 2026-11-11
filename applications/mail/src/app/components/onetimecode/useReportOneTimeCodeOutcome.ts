import { useEffect } from 'react';

import type { OneTimeCodeSource } from '@proton/mail-message/helpers/message/otp/OneTimeCodeDetector';
import { OtpGateSource } from '@proton/mail-message/helpers/message/otp/shouldRunOtpExtraction';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import type { OneTimeCodeLocation } from './oneTimeCodeEvents';
import { ABSENT_CODE_SOURCE, codeFoundEvent, codeNotFoundEvent } from './oneTimeCodeEvents';

export interface OneTimeCodeOutcome {
    location: OneTimeCodeLocation;
    emailID: string;
    gateSource: OtpGateSource;
    /** Null when detection ran and found no code. */
    codeSource: OneTimeCodeSource | null;
}

/**
 * How many reported outcomes are remembered. Outcomes exist only for emails under 20 minutes old, so
 * an email evicted after this many newer reports has in practice aged out of the gate already.
 */
export const MAX_REMEMBERED_OUTCOMES = 500;

// A Set iterates in insertion order, so its first entry is the oldest report.
const reportedOutcomeKeys = new Set<string>();

const rememberOutcome = (key: string): void => {
    reportedOutcomeKeys.add(key);
    if (reportedOutcomeKeys.size > MAX_REMEMBERED_OUTCOMES) {
        const [oldestKey] = reportedOutcomeKeys;
        reportedOutcomeKeys.delete(oldestKey);
    }
};

/**
 * Reports whether detection found a code in an email the backend flagged as a third-party
 * registration, once per email per location per page load. Pass null while there is nothing to
 * report yet (the gate failed, or the body is still being decrypted).
 */
export const useReportOneTimeCodeOutcome = (outcome: OneTimeCodeOutcome | null): void => {
    const location = outcome?.location;
    const gateSource = outcome?.gateSource;
    const codeSource = outcome?.codeSource ?? null;
    const key = outcome ? `${outcome.location}:${outcome.emailID}` : null;
    const isThirdPartyRegistration = !!gateSource && gateSource !== OtpGateSource.SUBJECT;

    useEffect(() => {
        if (!key || !location || !gateSource || !isThirdPartyRegistration || reportedOutcomeKeys.has(key)) {
            return;
        }
        rememberOutcome(key);

        if (codeSource) {
            tracker.emit(codeFoundEvent, { dimensions: { location, gateSource, codeSource } });
        } else {
            tracker.emit(codeNotFoundEvent, { dimensions: { location, gateSource, codeSource: ABSENT_CODE_SOURCE } });
        }
    }, [key, location, isThirdPartyRegistration, gateSource, codeSource]);
};

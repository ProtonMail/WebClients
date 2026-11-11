import { renderHook } from '@testing-library/react';

import { OneTimeCodeSource } from '@proton/mail-message/helpers/message/otp/OneTimeCodeDetector';
import { OtpGateSource } from '@proton/mail-message/helpers/message/otp/shouldRunOtpExtraction';
import { mockTracker } from '@proton/telemetry-tracker/testing';

import { OneTimeCodeLocation } from './oneTimeCodeEvents';
import type { OneTimeCodeOutcome } from './useReportOneTimeCodeOutcome';
import { MAX_REMEMBERED_OUTCOMES, useReportOneTimeCodeOutcome } from './useReportOneTimeCodeOutcome';

let tracked: ReturnType<typeof mockTracker>;

/**
 * Pins the wire contract against `definitions/mail/one_time_code.yaml` in the telemetry repo: the
 * strings here are the strings the aggregation reads.
 */
const sentReports = () => {
    return tracked.reports.map(({ measurementGroup, event, dimensions, delay }) => {
        return { measurementGroup, event, dimensions, delay };
    });
};

const wireReport = (event: string, dimensions: Record<string, string>) => {
    return { measurementGroup: 'mail.web.one_time_code', event, dimensions, delay: false };
};

// Outcomes are remembered for the page load, so every case uses its own email ID.
const flaggedOutcome = (emailID: string): OneTimeCodeOutcome => {
    return {
        location: OneTimeCodeLocation.MESSAGE,
        emailID,
        gateSource: OtpGateSource.THIRD_PARTY_REGISTRATION,
        codeSource: OneTimeCodeSource.BODY,
    };
};

const renderOutcome = (outcome: OneTimeCodeOutcome | null) => {
    return renderHook(
        (current: OneTimeCodeOutcome | null) => {
            useReportOneTimeCodeOutcome(current);
        },
        { initialProps: outcome }
    );
};

const reportCount = () => {
    return tracked.reports.length;
};

describe('useReportOneTimeCodeOutcome', () => {
    beforeEach(() => {
        tracked = mockTracker();
    });

    afterEach(() => {
        tracked.restore();
    });

    it('reports code_found with the code source for a flagged email with a code', () => {
        renderOutcome(flaggedOutcome('found'));

        expect(sentReports()).toEqual([
            wireReport('code_found', {
                location: 'message',
                gateSource: 'third_party_registration',
                codeSource: 'body',
            }),
        ]);
    });

    it('reports code_not_found with no code source for a flagged email without a code', () => {
        renderOutcome({ ...flaggedOutcome('not-found'), gateSource: OtpGateSource.BOTH, codeSource: null });

        expect(sentReports()).toEqual([
            wireReport('code_not_found', { location: 'message', gateSource: 'both', codeSource: 'n/a' }),
        ]);
    });

    it('reports nothing for an email that passed the gate on its subject alone', () => {
        renderOutcome({ ...flaggedOutcome('unflagged'), gateSource: OtpGateSource.SUBJECT });

        expect(reportCount()).toBe(0);
    });

    it('reports nothing for a null outcome', () => {
        renderOutcome(null);

        expect(reportCount()).toBe(0);
    });

    it('reports once across re-renders and a second hook for the same email and location', () => {
        const outcome = flaggedOutcome('repeated');
        const { rerender } = renderOutcome(outcome);
        rerender({ ...outcome });
        renderOutcome({ ...outcome });

        expect(reportCount()).toBe(1);
    });

    it('reports the same email again in the other location', () => {
        const outcome = flaggedOutcome('both-locations');
        renderOutcome(outcome);
        renderOutcome({ ...outcome, location: OneTimeCodeLocation.LIST, codeSource: OneTimeCodeSource.TITLE });

        expect(sentReports()).toEqual([
            wireReport('code_found', {
                location: 'message',
                gateSource: 'third_party_registration',
                codeSource: 'body',
            }),
            wireReport('code_found', { location: 'list', gateSource: 'third_party_registration', codeSource: 'title' }),
        ]);
    });

    it('reports once when the outcome arrives after the body is decrypted', () => {
        const { rerender } = renderOutcome(null);
        expect(reportCount()).toBe(0);

        rerender(flaggedOutcome('decrypted-later'));
        rerender(flaggedOutcome('decrypted-later'));

        expect(reportCount()).toBe(1);
    });

    it('forgets the oldest outcome once more than the limit have been reported', () => {
        const { rerender } = renderOutcome(flaggedOutcome('oldest'));
        for (let index = 1; index < MAX_REMEMBERED_OUTCOMES; index += 1) {
            rerender(flaggedOutcome(`newer-${index}`));
        }
        rerender(flaggedOutcome('oldest'));
        expect(reportCount()).toBe(MAX_REMEMBERED_OUTCOMES);

        rerender(flaggedOutcome('one-past-the-limit'));
        rerender(flaggedOutcome('oldest'));

        expect(reportCount()).toBe(MAX_REMEMBERED_OUTCOMES + 2);
    });
});

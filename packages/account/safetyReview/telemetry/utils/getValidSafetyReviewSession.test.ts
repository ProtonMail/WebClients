import { add } from 'date-fns';

import { SafetyReviewCohort } from './getCohort';
import { type SafetyReviewTelemetrySession, getValidSafetyReviewSession } from './getValidSafetyReviewSession';

const today = new Date('2005-05-25');
jest.useFakeTimers().setSystemTime(today);

describe('getValidSecurityCheckupSession', () => {
    test('returns new session if current session is undefined', () => {
        const currentSession = undefined;
        const currentCohort = SafetyReviewCohort.ACCOUNT_RECOVERY_ENABLED;

        const result = getValidSafetyReviewSession({ currentSession, currentCohort });

        const newSession: SafetyReviewTelemetrySession = {
            initialCohort: currentCohort,
            createdTimestamp: today.getTime(),
        };
        expect(result).toEqual(newSession);
    });

    test('returns current session if it has not expired', () => {
        const currentSession: SafetyReviewTelemetrySession = {
            initialCohort: SafetyReviewCohort.NO_RECOVERY_METHOD,
            createdTimestamp: add(today, {
                hours: -1,
            }).getTime(),
        };
        const currentCohort = SafetyReviewCohort.ACCOUNT_RECOVERY_ENABLED;

        const result = getValidSafetyReviewSession({ currentSession, currentCohort });

        expect(result).toEqual(currentSession);
    });

    test('returns new session if current session has expired', () => {
        const currentSession: SafetyReviewTelemetrySession = {
            initialCohort: SafetyReviewCohort.NO_RECOVERY_METHOD,
            createdTimestamp: add(today, {
                hours: -1,
                seconds: -1,
            }).getTime(),
        };
        const currentCohort = SafetyReviewCohort.ACCOUNT_RECOVERY_ENABLED;

        const result = getValidSafetyReviewSession({ currentSession, currentCohort });

        const newSession: SafetyReviewTelemetrySession = {
            initialCohort: currentCohort,
            createdTimestamp: today.getTime(),
        };

        expect(result).toEqual(newSession);
    });
});

import { differenceInMilliseconds } from 'date-fns';

import { HOUR } from '@proton/shared/lib/constants';

import type { SafetyReviewCohort } from './getCohort';

const SAFETY_REVIEW_SESSION_MAX_AGE = 1 * HOUR;

export interface SafetyReviewTelemetrySession {
    initialCohort: SafetyReviewCohort;
    createdTimestamp: number;
}

export const getValidSafetyReviewSession = ({
    currentSession,
    currentCohort,
}: {
    currentSession: SafetyReviewTelemetrySession | undefined;
    currentCohort: SafetyReviewCohort;
}) => {
    const createdTimestamp = Date.now();
    const nextSession = {
        initialCohort: currentCohort,
        createdTimestamp,
    };

    if (!currentSession) {
        return nextSession;
    }

    const sessionAge = differenceInMilliseconds(Date.now(), currentSession.createdTimestamp);
    const hasExpired = sessionAge > SAFETY_REVIEW_SESSION_MAX_AGE;

    if (hasExpired) {
        return nextSession;
    }

    return currentSession;
};

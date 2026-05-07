import { isValid } from 'date-fns';

import * as sessionStorage from '@proton/shared/lib/helpers/sessionStorage';

import type { SafetyReviewCohort } from './getCohort';
import type { SafetyReviewTelemetrySession } from './getValidSafetyReviewSession';

const getSafetyReviewSessionStorageId = (userId: string) => `SR:${userId}:session`;

export const getSafetyReviewSessionItem = (userId: string): SafetyReviewTelemetrySession | undefined => {
    const serializedSession = sessionStorage.getItem(getSafetyReviewSessionStorageId(userId));
    if (!serializedSession) {
        return undefined;
    }

    try {
        const { initialCohort, createdTimestamp } = JSON.parse(serializedSession);

        if (typeof initialCohort !== 'string' || typeof createdTimestamp !== 'number') {
            return undefined;
        }

        const parsedDate = new Date(createdTimestamp);
        const isValidDate = isValid(parsedDate);

        if (!isValidDate) {
            return undefined;
        }

        return {
            initialCohort: initialCohort as SafetyReviewCohort,
            createdTimestamp,
        };
    } catch (error) {
        return undefined;
    }
};

export const setSafetyReviewSessionItem = (safetyReviewSession: SafetyReviewTelemetrySession, userId: string) => {
    sessionStorage.setItem(getSafetyReviewSessionStorageId(userId), JSON.stringify(safetyReviewSession));
};

export const removeSafetyReviewSessionItem = (userId: string) => {
    sessionStorage.removeItem(getSafetyReviewSessionStorageId(userId));
};

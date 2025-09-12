import { isValid } from 'date-fns';

import * as sessionStorage from '@proton/shared/lib/helpers/sessionStorage';
import type { SecurityCheckupSession } from '@proton/shared/lib/interfaces/securityCheckup';
import type { SecurityCheckupCohortType } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';

const getSecurityCheckupSessionStorageId = (userId: string) => `SC:${userId}:session`;

export const getSecurityCheckupSessionItem = (userId: string): SecurityCheckupSession | undefined => {
    const serializedSession = sessionStorage.getItem(getSecurityCheckupSessionStorageId(userId));
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
            initialCohort: initialCohort as SecurityCheckupCohortType,
            createdTimestamp,
        };
    } catch (error) {
        return undefined;
    }
};

export const setSecurityCheckupSessionItem = (securityCheckupSession: SecurityCheckupSession, userId: string) => {
    sessionStorage.setItem(getSecurityCheckupSessionStorageId(userId), JSON.stringify(securityCheckupSession));
};

export const removeSecurityCheckupSessionItem = (userId: string) => {
    sessionStorage.removeItem(getSecurityCheckupSessionStorageId(userId));
};

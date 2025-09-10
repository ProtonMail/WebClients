import { differenceInMilliseconds } from 'date-fns';

import type { SecurityCheckupSession } from '@proton/shared/lib/interfaces/securityCheckup';
import type { SecurityCheckupCohortType } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';

import { SECURITY_SESSION_MAX_AGE } from '../consts';

const getValidSecurityCheckupSession = ({
    currentSession,
    currentCohort,
}: {
    currentSession: SecurityCheckupSession | undefined;
    currentCohort: SecurityCheckupCohortType;
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
    const hasExpired = sessionAge > SECURITY_SESSION_MAX_AGE;

    if (hasExpired) {
        return nextSession;
    }

    return currentSession;
};

export default getValidSecurityCheckupSession;

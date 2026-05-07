import { differenceInMilliseconds } from 'date-fns';

import { HOUR } from '@proton/shared/lib/constants';
import type { SecurityCheckupSession } from '@proton/shared/lib/interfaces/securityCheckup';
import type { SecurityCheckupCohortType } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';

const SECURITY_SESSION_MAX_AGE = 1 * HOUR;

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

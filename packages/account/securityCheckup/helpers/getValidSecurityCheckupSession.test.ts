import { add } from 'date-fns';

import type { SecurityCheckupSession } from '@proton/shared/lib/interfaces/securityCheckup';
import { SecurityCheckupCohort } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';

import getValidSecurityCheckupSession from './getValidSecurityCheckupSession';

const today = new Date('2021-06-14');
jest.useFakeTimers().setSystemTime(today);

describe('getValidSecurityCheckupSession', () => {
    test('returns new session if current session is undefined', () => {
        const currentSession = undefined;
        const currentCohort = SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED;

        const result = getValidSecurityCheckupSession({ currentSession, currentCohort });

        const newSession: SecurityCheckupSession = {
            initialCohort: currentCohort,
            createdTimestamp: today.getTime(),
        };
        expect(result).toEqual(newSession);
    });

    test('returns current session if it has not expired', () => {
        const currentSession: SecurityCheckupSession = {
            initialCohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            createdTimestamp: add(today, {
                hours: -1,
            }).getTime(),
        };
        const currentCohort = SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED;

        const result = getValidSecurityCheckupSession({ currentSession, currentCohort });

        expect(result).toEqual(currentSession);
    });

    test('returns new session if current session has expired', () => {
        const currentSession: SecurityCheckupSession = {
            initialCohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            createdTimestamp: add(today, {
                hours: -1,
                seconds: -1,
            }).getTime(),
        };
        const currentCohort = SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED;

        const result = getValidSecurityCheckupSession({ currentSession, currentCohort });

        const newSession: SecurityCheckupSession = {
            initialCohort: currentCohort,
            createdTimestamp: today.getTime(),
        };

        expect(result).toEqual(newSession);
    });
});

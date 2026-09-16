import { AccessType } from '../../lib/authentication/accessType';
import type { ActiveSessionLite } from '../../lib/authentication/persistedSessionHelper';
import { SessionAccessTypeFlag } from '../../lib/authentication/sessionAccessType';
import { getSessionDisplayData } from '../../lib/authentication/sessionDisplay';

const getSession = (AccessType: number): ActiveSessionLite => ({
    remote: {
        UID: 'uid',
        LocalID: 4,
        DisplayName: 'Display Name',
        Username: 'username',
        PrimaryEmail: 'user@proton.me',
        UserID: 'user-1',
        AccessType,
    },
    persisted: { localID: 4 },
});

describe('getSessionDisplayData', () => {
    it('reports the access type the API returned', () => {
        expect(getSessionDisplayData(getSession(SessionAccessTypeFlag.AdminAccess)).accessType).toBe(
            AccessType.AdminAccess
        );
        expect(getSessionDisplayData(getSession(SessionAccessTypeFlag.DelegatedAccess)).accessType).toBe(
            AccessType.EmergencyAccess
        );
        expect(getSessionDisplayData(getSession(0)).accessType).toBe(AccessType.Self);
    });

    it('derives the rest of the display data from the remote session', () => {
        expect(getSessionDisplayData(getSession(0))).toMatchObject({
            localID: 4,
            name: 'Display Name',
            initials: 'DN',
            email: 'user@proton.me',
            maybeEmailInBrackets: '<user@proton.me>',
            path: '/u/4',
        });
    });
});

import type { DefaultPersistedSession } from '../../lib/authentication/SessionInterface';
import { SessionSource } from '../../lib/authentication/SessionInterface';
import { AccessType } from '../../lib/authentication/accessType';
import {
    findPersistedSessionByAccessType,
    findPersistedSessionByLocalID,
    findPersistedSessionByUserID,
} from '../../lib/authentication/persistedSessionHelper';
import { SessionAccessTypeFlag, selfAccessTypeMask } from '../../lib/authentication/sessionAccessType';

const getSession = (value: Partial<DefaultPersistedSession> & Pick<DefaultPersistedSession, 'localID'>) =>
    ({
        UserID: 'user-1',
        UID: `uid-${value.localID}`,
        accessTypeMask: selfAccessTypeMask,
        source: SessionSource.Proton,
        persistent: true,
        trusted: false,
        payloadVersion: 1,
        payloadType: 'default',
        persistedAt: 0,
        ...value,
    }) as DefaultPersistedSession;

const source = [SessionSource.Proton, SessionSource.Saml];

/**
 * The case the access type exists to disambiguate: a user signed into their own account, and an
 * admin signed into that same account.
 */
const own = getSession({ localID: 1 });
const adminAccess = getSession({ localID: 2, accessTypeMask: SessionAccessTypeFlag.AdminAccess });
const persistedSessions = [own, adminAccess];

describe('findPersistedSessionByLocalID', () => {
    it('picks the session out by local id alone', () => {
        expect(findPersistedSessionByLocalID({ persistedSessions, localID: 2, UserID: 'user-1', source })).toBe(
            adminAccess
        );
        expect(findPersistedSessionByLocalID({ persistedSessions, localID: 1, UserID: 'user-1', source })).toBe(own);
    });

    it('does not match when the slot holds a different user', () => {
        expect(
            findPersistedSessionByLocalID({ persistedSessions, localID: 2, UserID: 'user-2', source })
        ).toBeUndefined();
    });

    it('still honours the source filter, so an oauth session is left alone', () => {
        const oauth = [getSession({ localID: 3, source: SessionSource.Oauth })];

        expect(findPersistedSessionByLocalID({ persistedSessions: oauth, localID: 3, UserID: 'user-1', source })).toBe(
            undefined
        );
        expect(
            findPersistedSessionByLocalID({ persistedSessions: oauth, localID: 3, UserID: 'user-1', source: null })
        ).toBe(oauth[0]);
    });
});

describe('findPersistedSessionByUserID', () => {
    it('finds a session without being told which kind of access it is', () => {
        expect(findPersistedSessionByUserID({ persistedSessions, UserID: 'user-1', source })).toBe(own);
    });

    it('does not match another user', () => {
        expect(findPersistedSessionByUserID({ persistedSessions, UserID: 'user-2', source })).toBeUndefined();
    });

    it('honours the source filter', () => {
        const oauth = [getSession({ localID: 3, source: SessionSource.Oauth })];

        expect(findPersistedSessionByUserID({ persistedSessions: oauth, UserID: 'user-1', source })).toBeUndefined();
    });

    it('returns whichever session comes first, so the caller has to check the access type itself', () => {
        // The reason `maybeResumeSessionByUser` compares the resumed user against the one it was
        // given rather than trusting this to hand back the right session
        expect(findPersistedSessionByUserID({ persistedSessions: [adminAccess, own], UserID: 'user-1', source })).toBe(
            adminAccess
        );
    });
});

describe('findPersistedSessionByAccessType', () => {
    it('tells the two sessions for one user apart by access type', () => {
        expect(
            findPersistedSessionByAccessType({
                persistedSessions,
                UserID: 'user-1',
                accessType: AccessType.AdminAccess,
                source,
            })
        ).toBe(adminAccess);
        expect(
            findPersistedSessionByAccessType({
                persistedSessions,
                UserID: 'user-1',
                accessType: AccessType.Self,
                source,
            })
        ).toBe(own);
    });

    it('matches a session holding several flags on what its mask collapses to', () => {
        // The URL this comes from can only ever name one access type, so comparing the mask itself
        // would miss this session and leave it signed in
        const adminAndOrg = getSession({
            localID: 4,
            accessTypeMask: SessionAccessTypeFlag.AdminAccess | SessionAccessTypeFlag.OrgAccess,
        });

        expect(
            findPersistedSessionByAccessType({
                persistedSessions: [adminAndOrg],
                UserID: 'user-1',
                accessType: AccessType.AdminAccess,
                source,
            })
        ).toBe(adminAndOrg);
    });

    it('does not match an access type no session collapses to', () => {
        expect(
            findPersistedSessionByAccessType({
                persistedSessions,
                UserID: 'user-1',
                accessType: AccessType.Msp,
                source,
            })
        ).toBeUndefined();
    });
});

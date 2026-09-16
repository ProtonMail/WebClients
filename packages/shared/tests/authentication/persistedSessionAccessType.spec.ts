import type { DefaultPersistedSession } from '../../lib/authentication/SessionInterface';
import { SessionSource } from '../../lib/authentication/SessionInterface';
import { AccessType } from '../../lib/authentication/accessType';
import { getPersistedSession, setPersistedSession } from '../../lib/authentication/persistedSessionStorage';
import { SessionAccessTypeFlag, selfAccessTypeMask } from '../../lib/authentication/sessionAccessType';

const localID = 7;
const key = `ps-${localID}`;

const write = (value: object) => window.localStorage.setItem(key, JSON.stringify(value));

const stored = {
    UserID: 'user-1',
    UID: 'uid-1',
    source: SessionSource.Proton,
    persistent: true,
    trusted: false,
    payloadVersion: 1,
    payloadType: 'default',
    persistedAt: 1,
};

describe('getPersistedSession access type', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('reads the mask when one is stored', () => {
        const accessTypeMask = SessionAccessTypeFlag.DelegatedAccess | SessionAccessTypeFlag.OrgAccess;
        write({ ...stored, accessTypeMask });

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(accessTypeMask);
    });

    it('keeps a combined mask that a single value could not have expressed', () => {
        // 3 as a single value means Msp, but as a mask it is admin + delegated
        write({ ...stored, accessTypeMask: 3 });

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(
            SessionAccessTypeFlag.AdminAccess | SessionAccessTypeFlag.DelegatedAccess
        );
    });

    it('prefers the mask over the single value written alongside it', () => {
        write({ ...stored, accessTypeMask: SessionAccessTypeFlag.OrgAccess, accessType: AccessType.Self });

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(SessionAccessTypeFlag.OrgAccess);
    });

    it('widens a legacy Msp, the one value that is not already its own flag', () => {
        write({ ...stored, accessType: AccessType.Msp });

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(SessionAccessTypeFlag.OrgAccess);
    });

    it.each([
        [AccessType.Self, selfAccessTypeMask],
        [AccessType.AdminAccess, SessionAccessTypeFlag.AdminAccess],
        [AccessType.EmergencyAccess, SessionAccessTypeFlag.DelegatedAccess],
    ])('widens a legacy value of %i', (accessType, expected) => {
        write({ ...stored, accessType });

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(expected);
    });

    it.each([
        [{ isSubUser: false }, selfAccessTypeMask],
        [{ isSubUser: true }, SessionAccessTypeFlag.AdminAccess],
        [{ isSelf: true }, selfAccessTypeMask],
        [{ isSelf: false }, SessionAccessTypeFlag.AdminAccess],
    ])('widens the pre-accessType shape %o', (legacy, expected) => {
        write({ ...stored, ...legacy });

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(expected);
    });

    it('falls back to self access when nothing is stored', () => {
        write(stored);

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(selfAccessTypeMask);
    });
});

describe('setPersistedSession access type', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    const getSession = (accessTypeMask: number): DefaultPersistedSession => ({
        ...stored,
        payloadType: 'default',
        payloadVersion: 1,
        localID,
        accessTypeMask,
    });

    it('writes the mask and a single value for clients that only read one', async () => {
        await setPersistedSession(getSession(SessionAccessTypeFlag.OrgAccess));

        expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({
            accessTypeMask: SessionAccessTypeFlag.OrgAccess,
            accessType: AccessType.Msp,
        });
    });

    it('collapses a combined mask by precedence for the single value', async () => {
        await setPersistedSession(
            getSession(SessionAccessTypeFlag.AdminAccess | SessionAccessTypeFlag.DelegatedAccess)
        );

        expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({
            accessTypeMask: 3,
            accessType: AccessType.AdminAccess,
        });
    });

    it('round-trips the mask it wrote', async () => {
        const accessTypeMask = SessionAccessTypeFlag.DelegatedAccess | SessionAccessTypeFlag.OrgAccess;
        await setPersistedSession(getSession(accessTypeMask));

        expect(getPersistedSession(localID)?.accessTypeMask).toBe(accessTypeMask);
    });
});

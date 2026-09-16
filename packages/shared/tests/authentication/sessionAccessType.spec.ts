import { AccessType } from '../../lib/authentication/accessType';
import {
    SessionAccessTypeFlag,
    getAccessTypeFromMask,
    getSessionAccessTypeMask,
} from '../../lib/authentication/sessionAccessType';
import type { User } from '../../lib/interfaces';

const getUser = ({
    OrganizationPrivateKey,
    delegatedAccess = false,
    orgAccess = false,
}: {
    OrganizationPrivateKey?: string;
    delegatedAccess?: boolean;
    orgAccess?: boolean;
}) =>
    ({
        OrganizationPrivateKey,
        Flags: { 'delegated-access': delegatedAccess, 'org-access': orgAccess },
    }) as User;

describe('getSessionAccessTypeMask', () => {
    it('is empty for a plain self session', () => {
        expect(getSessionAccessTypeMask(getUser({}))).toBe(0);
    });

    it('sets the admin flag for an organization private key', () => {
        expect(getSessionAccessTypeMask(getUser({ OrganizationPrivateKey: 'key' }))).toBe(
            SessionAccessTypeFlag.AdminAccess
        );
    });

    it('sets the delegated flag', () => {
        expect(getSessionAccessTypeMask(getUser({ delegatedAccess: true }))).toBe(
            SessionAccessTypeFlag.DelegatedAccess
        );
    });

    it('sets the org flag', () => {
        expect(getSessionAccessTypeMask(getUser({ orgAccess: true }))).toBe(SessionAccessTypeFlag.OrgAccess);
    });

    it('combines the flags, since they are not mutually exclusive', () => {
        expect(getSessionAccessTypeMask(getUser({ delegatedAccess: true, orgAccess: true }))).toBe(
            SessionAccessTypeFlag.DelegatedAccess | SessionAccessTypeFlag.OrgAccess
        );
    });

    it('tolerates a user without flags', () => {
        expect(getSessionAccessTypeMask({} as User)).toBe(0);
    });
});

describe('getAccessTypeFromMask', () => {
    it('maps each flag on its own', () => {
        expect(getAccessTypeFromMask(0)).toBe(AccessType.Self);
        expect(getAccessTypeFromMask(SessionAccessTypeFlag.AdminAccess)).toBe(AccessType.AdminAccess);
        expect(getAccessTypeFromMask(SessionAccessTypeFlag.DelegatedAccess)).toBe(AccessType.EmergencyAccess);
        expect(getAccessTypeFromMask(SessionAccessTypeFlag.OrgAccess)).toBe(AccessType.Msp);
    });

    it('resolves a combined mask by precedence, not by its numeric value', () => {
        // 3 would be Msp if the mask were read as a plain access type
        expect(getAccessTypeFromMask(SessionAccessTypeFlag.AdminAccess | SessionAccessTypeFlag.DelegatedAccess)).toBe(
            AccessType.AdminAccess
        );
        expect(getAccessTypeFromMask(SessionAccessTypeFlag.DelegatedAccess | SessionAccessTypeFlag.OrgAccess)).toBe(
            AccessType.EmergencyAccess
        );
    });

    it('ignores unknown flags', () => {
        expect(getAccessTypeFromMask(1 << 7)).toBe(AccessType.Self);
    });
});

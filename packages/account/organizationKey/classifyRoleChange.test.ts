import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';
import { MemberUnprivatizationState } from '@proton/shared/lib/interfaces';

import { classifyRoleChange, getIsMemberAdminOrPendingAdmin } from './classifyRoleChange';

const getMember = ({ role, invitationAdmin }: { role: MEMBER_ROLE; invitationAdmin?: boolean }) =>
    ({
        ID: 'member-id',
        Role: role,
        Unprivatization:
            invitationAdmin === undefined
                ? null
                : {
                      State: MemberUnprivatizationState.Pending,
                      InvitationData: JSON.stringify({
                          Address: 'user@example.com',
                          Revision: 1,
                          Admin: invitationAdmin,
                      }),
                  },
    }) as EnhancedMember;

describe('getIsMemberAdminOrPendingAdmin', () => {
    it('is true for an admin', () => {
        expect(getIsMemberAdminOrPendingAdmin(getMember({ role: MEMBER_ROLE.ORGANIZATION_ADMIN }))).toBe(true);
    });

    it('is true for a member with a pending admin invitation', () => {
        expect(
            getIsMemberAdminOrPendingAdmin(getMember({ role: MEMBER_ROLE.ORGANIZATION_MEMBER, invitationAdmin: true }))
        ).toBe(true);
    });

    it('is false for a member with a pending invitation without admin', () => {
        expect(
            getIsMemberAdminOrPendingAdmin(getMember({ role: MEMBER_ROLE.ORGANIZATION_MEMBER, invitationAdmin: false }))
        ).toBe(false);
    });

    it('is false for a member without invitation', () => {
        expect(getIsMemberAdminOrPendingAdmin(getMember({ role: MEMBER_ROLE.ORGANIZATION_MEMBER }))).toBe(false);
    });
});

describe('classifyRoleChange', () => {
    it('demotes a member with a pending admin invitation', () => {
        const classification = classifyRoleChange({
            member: getMember({ role: MEMBER_ROLE.ORGANIZATION_MEMBER, invitationAdmin: true }),
            targetRole: MEMBER_ROLE.ORGANIZATION_MEMBER,
            isPasswordlessOrg: true,
        });

        expect(classification).toEqual({ kind: 'demote', requiresPrompt: true });
    });

    it('throws when a member with a pending admin invitation is promoted', () => {
        expect(() =>
            classifyRoleChange({
                member: getMember({ role: MEMBER_ROLE.ORGANIZATION_MEMBER, invitationAdmin: true }),
                targetRole: MEMBER_ROLE.ORGANIZATION_ADMIN,
                isPasswordlessOrg: true,
            })
        ).toThrow('Unexpected role classification');
    });
});

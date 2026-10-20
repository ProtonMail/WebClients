import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';

import { getMemberUnprivatizationMode } from '../members/memberUnprivatization';

export type RoleChangeClassification =
    | {
          kind: 'promote';
          via: 'no-payload' | 'sso' | 'email';
          requiresPrompt: boolean;
      }
    | { kind: 'demote'; requiresPrompt: true };

export const getIsMemberAdminOrPendingAdmin = (member: Member) =>
    member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN || getMemberUnprivatizationMode(member).makeAdmin;

export const classifyRoleChange = ({
    member,
    targetRole,
    isPasswordlessOrg,
}: {
    member: EnhancedMember;
    targetRole: MEMBER_ROLE;
    isPasswordlessOrg: boolean;
}): RoleChangeClassification => {
    const isAdmin = getIsMemberAdminOrPendingAdmin(member);

    const toPromote = !isAdmin && targetRole === MEMBER_ROLE.ORGANIZATION_ADMIN;
    if (toPromote) {
        if (!isPasswordlessOrg) {
            return { kind: 'promote', via: 'no-payload', requiresPrompt: false };
        }
        if (member.SSO && !getIsMemberSetup(member)) {
            return { kind: 'promote', via: 'sso', requiresPrompt: true };
        }
        return {
            kind: 'promote',
            via: 'email',
            requiresPrompt: member.Private === MEMBER_PRIVATE.UNREADABLE,
        };
    }

    const toDemote = isAdmin && targetRole !== MEMBER_ROLE.ORGANIZATION_ADMIN;
    if (toDemote) {
        return { kind: 'demote', requiresPrompt: true };
    }

    throw new Error(`Unexpected role classification`);
};

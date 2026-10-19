import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { EnhancedMember, MemberUnprivatization } from '@proton/shared/lib/interfaces';
import { MEMBER_ORG_KEY_STATE, MemberUnprivatizationState } from '@proton/shared/lib/interfaces';

import { getHasPausedMemberRoleAssignment } from './memberUnprivatization';

const getMemberAwaitingOrgKey = (Unprivatization: Partial<MemberUnprivatization> | null) =>
    ({
        ID: 'member-id',
        Role: MEMBER_ROLE.ORGANIZATION_MEMBER,
        AccessToOrgKey: MEMBER_ORG_KEY_STATE.NoKey,
        requiresOrgKeyPromotion: true,
        Unprivatization,
    }) as EnhancedMember;

const adminInvitationData = JSON.stringify({ Address: 'user@example.com', Revision: 1, Admin: true });
const memberInvitationData = JSON.stringify({ Address: 'user@example.com', Revision: 1 });

describe('getHasPausedMemberRoleAssignment', () => {
    it('is paused when the member has no invitation', () => {
        const member = getMemberAwaitingOrgKey(null);

        expect(getHasPausedMemberRoleAssignment({ member })).toBe(true);
    });

    it('is not paused when the member has not accepted an admin invitation yet', () => {
        const member = getMemberAwaitingOrgKey({
            State: MemberUnprivatizationState.Pending,
            InvitationData: adminInvitationData,
        });

        expect(getHasPausedMemberRoleAssignment({ member })).toBe(false);
    });

    it('is not paused when the member accepted an admin invitation that an admin has not finished yet', () => {
        const member = getMemberAwaitingOrgKey({
            State: MemberUnprivatizationState.Ready,
            InvitationData: adminInvitationData,
        });

        expect(getHasPausedMemberRoleAssignment({ member })).toBe(false);
    });

    it('is paused when the member has an invitation without admin rights', () => {
        const member = getMemberAwaitingOrgKey({
            State: MemberUnprivatizationState.Pending,
            InvitationData: memberInvitationData,
        });

        expect(getHasPausedMemberRoleAssignment({ member })).toBe(true);
    });
});

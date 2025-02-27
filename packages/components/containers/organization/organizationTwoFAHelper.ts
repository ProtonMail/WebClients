import { type EnhancedMember, MEMBER_STATE } from '@proton/shared/lib/interfaces';

export const getTwoFAMemberStatistics = (members?: EnhancedMember[]) => {
    const canHaveTwoFAMembers =
        members?.filter((member) => member.State === MEMBER_STATE.STATUS_ENABLED && !member.SSO) || [];
    const noTwoFAMembers = canHaveTwoFAMembers.filter((member) => member['2faStatus'] === 0);

    const hasSSOMembers = members?.some((member) => member.SSO === 1) || false;
    const canHaveTwoFAMembersLength = canHaveTwoFAMembers.length;
    const noTwoFAMembersLength = noTwoFAMembers.length;
    const hasTwoFAMembersLength = canHaveTwoFAMembersLength - noTwoFAMembersLength;

    return {
        hasSSOMembers,
        canHaveTwoFAMembersLength,
        noTwoFAMembers,
        noTwoFAMembersLength,
        hasTwoFAMembersLength,
    };
};

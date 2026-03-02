import { MemberRole } from '@proton/drive';

const ROLE_RANK: Partial<Record<MemberRole, number>> = {
    [MemberRole.Viewer]: 1,
    [MemberRole.Editor]: 2,
    [MemberRole.Admin]: 3,
};

/**
 * Returns true if the user's direct role grants at least as much access as the public link role,
 * meaning they should be redirected to the private app rather than staying on the public page.
 */
export const shouldRedirectToPrivateApp = (
    directRole: MemberRole | undefined,
    publicRole: MemberRole | undefined
): boolean => {
    if (!directRole) {
        return false;
    }
    const directRoleRank = ROLE_RANK[directRole] ?? 0;
    const publicRoleRank = publicRole ? (ROLE_RANK[publicRole] ?? 0) : 0;
    return directRoleRank >= publicRoleRank;
};

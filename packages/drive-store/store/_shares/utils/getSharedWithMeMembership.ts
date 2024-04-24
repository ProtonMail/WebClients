import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { ShareMembership } from '../interface';

/*
 * This helper is just here to centralize the check of if the memberships array is correct.
 * This should only be used within Shared with me section.
 */
export const getSharedWithMeMembership = (shareId: string, memberships: ShareMembership[]) => {
    // Backend already filter memberships, and we will always get one which is the one to use
    const membership = memberships[0];

    // This should never happen as backend always return one membership
    if (!membership) {
        throw new EnrichedError('Error finding an membership of the user for the share', {
            tags: {
                shareId,
            },
        });
    }

    return membership;
};

import { c, msgid } from 'ttag';

import { resumeMemberRoleAssignment } from '@proton/account/members/actions';
import { useMembers } from '@proton/account/members/hooks';
import { selectMembersWithPausedRoleAssignment } from '@proton/account/members/selectors';
import { useResumeRoleAssignment } from '@proton/components/containers/members/rolesAndPermissions/useResumeRoleAssignment';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';

export const useMemberRoleAssignmentRetry = () => {
    const dispatch = useDispatch();
    const api = useSilentApi();

    // Fetch, because paginated MembersRemote path has no other subscriber to the members model
    useMembers();
    // Read from store! Rendered list can be filtered, paginated and have placeholder values instead of roles
    const pausedMembers = useSelector(selectMembersWithPausedRoleAssignment);

    const {
        resumingSourceId: resumingMemberID,
        resumeOne,
        toggleResumeAll,
    } = useResumeRoleAssignment({
        successText: c('Info').t`User roles assigned`,
        getErrorText: (failedCount) =>
            c('Error').ngettext(
                msgid`Role assignment could not be completed for ${failedCount} user`,
                `Role assignment could not be completed for ${failedCount} users`,
                failedCount
            ),
    });

    const retryOne = (memberID: string) => dispatch(resumeMemberRoleAssignment({ memberID, api }));

    return {
        pausedMembers,
        resumingMemberID,
        handleRetryMemberRoleAssignment: (member: EnhancedMember) =>
            resumeOne({ sourceId: member.ID, resume: retryOne }),
        handleToggleRoleAssignments: () =>
            toggleResumeAll({ sourceIds: pausedMembers.map(({ ID }) => ID), resume: retryOne }),
    };
};

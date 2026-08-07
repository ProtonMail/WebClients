import { c, msgid } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';

import { useGroupsManagement } from './context/GroupsManagementContext';
import { GROUPS_RESTRICTION_REASON } from './types';

const GroupRoleAssignmentPausedBanner = () => {
    const { groups, actions, restrictedBy } = useGroupsManagement();
    const isResumingRoleAssignments = restrictedBy.reason === GROUPS_RESTRICTION_REASON.RESUMING_ROLE_ASSIGNMENT;
    const pausedCount = groups.filter((group) => group.requiresOrgKeyPromotion).length;

    if (pausedCount === 0) {
        return null;
    }

    return (
        <Banner
            variant={BannerVariants.WARNING}
            noIcon
            largeRadius
            className="p-2 mb-4"
            contentWrapperClassName="flex-1 flex items-start gap-3"
        >
            <span className="flex-1 flex flex-column">
                <span className="text-semibold">{c('Title').t`Group role assignment paused`}</span>
                <span>
                    {c('Info').ngettext(
                        msgid`The process was interrupted for ${pausedCount} group. Click Continue to resume assigning roles.`,
                        `The process was interrupted for ${pausedCount} groups. Click Continue to resume assigning roles.`,
                        pausedCount
                    )}
                </span>
            </span>
            <Button shape="outline" onClick={() => actions.onToggleRoleAssignments()}>
                {isResumingRoleAssignments ? c('Action').t`Pause` : c('Action').t`Continue`}
            </Button>
        </Banner>
    );
};

export default GroupRoleAssignmentPausedBanner;

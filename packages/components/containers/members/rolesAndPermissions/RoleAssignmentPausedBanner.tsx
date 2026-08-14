import { c, msgid } from 'ttag';

import { AdminRolesUIState, useAdminRolesUI } from '@proton/account/userPermissions/hooks';
import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ROLE_SOURCE } from '@proton/shared/lib/interfaces';
import capitalize from '@proton/utils/capitalize';

const RoleAssignmentPausedBanner = ({
    roleAssignmentSource,
    pausedCount,
    isResuming,
    onToggle,
}: {
    roleAssignmentSource: ROLE_SOURCE;
    pausedCount: number;
    isResuming: boolean;
    onToggle: () => void;
}) => {
    const [adminRolesUIState] = useAdminRolesUI();

    // OrganizationRole::Owner + RoleAssignmentSource::User is always allowed
    if (
        pausedCount === 0 ||
        (adminRolesUIState !== AdminRolesUIState.Enabled && roleAssignmentSource === ROLE_SOURCE.GROUP)
    ) {
        return null;
    }

    const capitalizedSource = capitalize(roleAssignmentSource);

    return (
        <Banner
            variant={BannerVariants.WARNING}
            noIcon
            largeRadius
            className="p-2 mb-4"
            contentWrapperClassName="flex-1 flex items-start gap-3"
        >
            <span className="flex-1 flex flex-column">
                <span className="text-semibold">{c('Title').t`${capitalizedSource} role assignment paused`}</span>
                <span>
                    {c('Info').ngettext(
                        msgid`The process was interrupted for ${pausedCount} ${roleAssignmentSource}. Click Continue to resume assigning roles.`,
                        `The process was interrupted for ${pausedCount} ${roleAssignmentSource}s. Click Continue to resume assigning roles.`,
                        pausedCount
                    )}
                </span>
            </span>
            <Button shape="outline" onClick={onToggle}>
                {isResuming ? c('Action').t`Pause` : c('Action').t`Continue`}
            </Button>
        </Banner>
    );
};

export default RoleAssignmentPausedBanner;

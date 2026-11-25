import { c, msgid } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';

interface Props {
    pendingUsersCount: number;
    pendingGroupsCount: number;
    cleanUpCount: number;
    onReviewChanges: () => void;
}

const getSyncedCountText = (pendingUsersCount: number, pendingGroupsCount: number) => {
    // translator: full sentence will be "<x user(s) synced>.
    if (pendingGroupsCount === 0) {
        return c('scim').ngettext(
            msgid`${pendingUsersCount} user synced.`,
            `${pendingUsersCount} users synced.`,
            pendingUsersCount
        );
    }

    // translator: full sentence will be "<x group(s) synced>.
    if (pendingUsersCount === 0) {
        return c('scim').ngettext(
            msgid`${pendingGroupsCount} group synced.`,
            `${pendingGroupsCount} groups synced.`,
            pendingGroupsCount
        );
    }

    // Both — build each fragment with its own plural form, then combine
    const usersText = c('scim').ngettext(
        msgid`${pendingUsersCount} user`,
        `${pendingUsersCount} users`,
        pendingUsersCount
    );

    const groupsText = c('scim').ngettext(
        msgid`${pendingGroupsCount} group`,
        `${pendingGroupsCount} groups`,
        pendingGroupsCount
    );

    // translator: full sentence will be "<x user(s)> and <x group(s) synced>.
    return c('scim').t`${usersText} and ${groupsText} synced.`;
};

const getCleanUpCountText = (cleanUpCount: number) => {
    // translator: full sentence will be "<x clean up action(s) required>.", shown on its own or after the "<x user(s)/group(s) synced>." sentence
    return c('scim').ngettext(
        msgid`${cleanUpCount} clean up action required.`,
        `${cleanUpCount} clean up actions required.`,
        cleanUpCount
    );
};

const getSyncedText = (pendingUsersCount: number, pendingGroupsCount: number, cleanUpCount: number) => {
    // Clean-up only: nothing new is granted, so the "grant access" approval text would be misleading
    if (!pendingUsersCount && !pendingGroupsCount) {
        const finalApprovalText = c('scim').t`Final approval needed to remove organization key access.`;

        return `${getCleanUpCountText(cleanUpCount)} ${finalApprovalText}`;
    }

    const countText = getSyncedCountText(pendingUsersCount, pendingGroupsCount);
    const cleanUpText = cleanUpCount > 0 ? ` ${getCleanUpCountText(cleanUpCount)}` : '';
    const finalApprovalText = c('scim').t`Final approval needed to grant access across all ${BRAND_NAME} services.`;

    return `${countText}${cleanUpText} ${finalApprovalText}`;
};

const getPermissionChangesText = (cleanUpCount: number) => {
    // translator: full sentence will be "<x user's/users'> permissions have changed. Final approval needed to revoke their organization keys."
    const countText = c('scim').ngettext(
        msgid`${cleanUpCount} user's permissions have changed.`,
        `${cleanUpCount} users' permissions have changed.`,
        cleanUpCount
    );
    const finalApprovalText = c('scim').t`Final approval needed to revoke their organization keys.`;

    return `${countText} ${finalApprovalText}`;
};

const ScimSetupBanner = ({ pendingUsersCount, pendingGroupsCount, cleanUpCount, onReviewChanges }: Props) => {
    const isUserGroupsScimGroupsEnabled = useFlag('UserGroupsScimGroups');
    const [organization] = useOrganization();

    // Without SCIM, only clean-ups unrelated to an identity provider can be pending here. To be extracted into a
    // standalone banner and modal: https://protonag.atlassian.net/browse/B2B-689
    const isPermissionChangesOnly = !organization?.IsScimEnabled && !pendingUsersCount && !pendingGroupsCount;

    if (!isUserGroupsScimGroupsEnabled || (!pendingUsersCount && !pendingGroupsCount && !cleanUpCount)) {
        return null;
    }

    return (
        <Banner
            className="p-2 mb-12"
            contentWrapperClassName="flex-1 flex"
            variant={BannerVariants.WARNING}
            largeRadius
            noIcon
        >
            <div className="flex-1">
                {isPermissionChangesOnly ? (
                    <>
                        <p className="m-0 text-bold">{c('scim').t`Approve permission changes for your organization`}</p>
                        <p className="m-0">{getPermissionChangesText(cleanUpCount)}</p>
                    </>
                ) : (
                    <>
                        <p className="m-0 text-bold">{c('scim').t`Approve changes from your identity provider`}</p>
                        <p className="m-0">{getSyncedText(pendingUsersCount, pendingGroupsCount, cleanUpCount)}</p>
                        <Href href={getKnowledgeBaseUrl('/scim-groups')} className="color-primary">
                            {c('Link').t`Learn more`}
                        </Href>
                    </>
                )}
            </div>
            <div>
                <Button shape="outline" onClick={onReviewChanges}>
                    {c('Action').t`Review changes`}
                </Button>
            </div>
        </Banner>
    );
};

export default ScimSetupBanner;

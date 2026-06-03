import { c, msgid } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';

interface Props {
    pendingUsersCount: number;
    pendingGroupsCount: number;
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

const getSyncedText = (pendingUsersCount: number, pendingGroupsCount: number) => {
    const countText = getSyncedCountText(pendingUsersCount, pendingGroupsCount);
    const finalApprovalText = c('scim').t`Final approval needed to grant access across all ${BRAND_NAME} services.`;

    return `${countText} ${finalApprovalText}`;
};

const ScimSetupBanner = ({ pendingUsersCount, pendingGroupsCount, onReviewChanges }: Props) => {
    const isUserGroupsScimGroupsEnabled = useFlag('UserGroupsScimGroups');

    if (!isUserGroupsScimGroupsEnabled || (!pendingUsersCount && !pendingGroupsCount)) {
        return null;
    }

    return (
        <Banner className="p-2 mb-5" contentWrapperClassName="flex-1 flex" variant={BannerVariants.WARNING} noIcon>
            <div className="flex-1">
                <p className="m-0 text-bold">{c('scim').t`Approve changes from your identity provider`}</p>
                <p className="m-0">{getSyncedText(pendingUsersCount, pendingGroupsCount)}</p>
                {/* TODO: link should be updated once we have knowledge page for scim */}
                <Href href={getKnowledgeBaseUrl('/groups')} className="color-primary">
                    PLEASE UPDATE ME
                </Href>
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

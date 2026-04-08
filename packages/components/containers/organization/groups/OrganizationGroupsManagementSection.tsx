import { useEffect } from 'react';

import { c } from 'ttag';

import { groupOwnerInvitesThunk } from '@proton/account/groupOwnerInvites';
import { useUser } from '@proton/account/user/hooks';
import { Card } from '@proton/atoms/Card/Card';
import { DualPaneContent } from '@proton/atoms/DualPane/DualPaneContent';
import { DualPaneSidebar } from '@proton/atoms/DualPane/DualPaneSidebar';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import canUseGroups from '@proton/components/containers/organization/groups/canUseGroups';
import { useDispatch } from '@proton/redux-shared-store';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import GroupForm from './GroupForm';
import GroupList from './GroupList';
import shouldShowMail from './shouldShowMail';
import useGroupsManagement from './useGroupsManagement';

import './OrganizationGroupsManagementSection.scss';

interface Props {
    organization?: Organization;
}

const OrganizationGroupsManagementSection = ({ organization }: Props) => {
    const groupsManagement = useGroupsManagement(organization);
    const [user, loadingUser] = useUser();
    const isUserGroupsNoCustomDomainEnabled = useFlag('UserGroupsNoCustomDomain');
    const isUserGroupsPassBusinessEnabled = useFlag('UserGroupsPassBusiness');
    const isUserGroupsGroupOwnerEnabled = useFlag('UserGroupsGroupOwner');
    const dispatch = useDispatch();

    useEffect(() => {
        if (isUserGroupsGroupOwnerEnabled) {
            dispatch(groupOwnerInvitesThunk()).catch(noop);
        }
    }, []);

    if (!groupsManagement || loadingUser || !user) {
        return <Loader />;
    }

    const {
        groups,
        domainData: { customDomains },
        suggestedAddressDomainSource,
    } = groupsManagement;
    const hasUsableDomain = customDomains?.some(getIsDomainActive) || isUserGroupsNoCustomDomainEnabled;

    const linkToDomainPage = (
        <SettingsLink key="link-to-domain-page" path="/domain-names">{c('Action').t`Domain name`}</SettingsLink>
    );

    const usingGroupsDomainButNotActive =
        suggestedAddressDomainSource === 'group' && !isUserGroupsNoCustomDomainEnabled;
    const canOnlyDelete =
        (!canUseGroups(organization?.PlanName, {
            isUserGroupsNoCustomDomainEnabled,
            isUserGroupsPassBusinessEnabled,
        }) ||
            usingGroupsDomainButNotActive) &&
        (groups?.length ?? 0) > 0;

    const showMailFeatures = shouldShowMail(organization?.PlanName);
    const mailDescription = c('Info')
        .t`With groups, you can quickly and easily send emails to all the people in a specified group.`;
    const genericDescription = c('Info')
        .t`With groups, you can implement the company security policies for access control and reduce the risk of accessing unauthorised data.`;

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsPageTitle className="mt-14">{c('Title').t`Groups`}</SettingsPageTitle>
            <SettingsParagraph className="flex flex-column flex-nowrap" learnMoreUrl={getKnowledgeBaseUrl('/groups')}>
                {showMailFeatures ? mailDescription : genericDescription}
            </SettingsParagraph>
            {!hasUsableDomain && (
                <SettingsParagraph>
                    {c('Info')
                        .jt`A custom domain is required to create groups. If you don't have a custom domain set up, do so first under ${linkToDomainPage}.`}
                </SettingsParagraph>
            )}
            {canOnlyDelete && (
                <Card
                    rounded
                    background
                    bordered={false}
                    className="max-w-custom mb-4"
                    style={{ '--max-w-custom': '43em' }}
                >
                    {c('Info')
                        .t`The groups feature is not supported on your current subscription. Previously created groups are disabled and can only be deleted.`}
                </Card>
            )}
            {(hasUsableDomain || usingGroupsDomainButNotActive) && (
                <div className="content flex-1 mt-8">
                    <div className="flex flex-nowrap flex-column h-full">
                        <div className="groups-dual-pane flex items-start justify-start flex-nowrap w-full gap-6">
                            <DualPaneSidebar>
                                <GroupList
                                    groupsManagement={groupsManagement}
                                    canOnlyDelete={canOnlyDelete}
                                    hasUsableDomain={hasUsableDomain}
                                />
                            </DualPaneSidebar>
                            <DualPaneContent>
                                <GroupForm groupsManagement={groupsManagement} canOnlyDelete={canOnlyDelete} />
                            </DualPaneContent>
                        </div>
                    </div>
                </div>
            )}
        </SettingsSectionWide>
    );
};

export default OrganizationGroupsManagementSection;

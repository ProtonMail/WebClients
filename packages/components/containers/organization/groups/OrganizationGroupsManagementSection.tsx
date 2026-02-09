import { useEffect } from 'react';

import { c } from 'ttag';

import { groupOwnerInvitesThunk } from '@proton/account/groupOwnerInvites';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { DualPaneContent } from '@proton/atoms/DualPane/DualPaneContent';
import { DualPaneSidebar } from '@proton/atoms/DualPane/DualPaneSidebar';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import canUseGroups from '@proton/components/containers/organization/groups/canUseGroups';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { useDispatch } from '@proton/redux-shared-store';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import { useFlag } from '@proton/unleash';
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
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(groupOwnerInvitesThunk()).catch(noop);
    }, []);

    if (!groupsManagement || loadingUser || !user) {
        return <Loader />;
    }

    const {
        groups,
        domainData: { customDomains },
        suggestedAddressDomainSource,
        actions,
    } = groupsManagement;
    const hasUsableDomain = customDomains?.some(getIsDomainActive) || isUserGroupsNoCustomDomainEnabled;
    const isAdmin = user.isAdmin;
    const linkToDomainPage = (
        <SettingsLink key="link-to-domain-page" path="/domain-names">{c('Action').t`Domain name`}</SettingsLink>
    );

    const usingGroupsDomainButNotActive =
        suggestedAddressDomainSource === 'group' && !isUserGroupsNoCustomDomainEnabled;
    const canOnlyDelete =
        (!canUseGroups(organization?.PlanName, { isUserGroupsNoCustomDomainEnabled }) ||
            usingGroupsDomainButNotActive) &&
        (groups?.length ?? 0) > 0;

    const showMail = shouldShowMail(organization?.PlanName);
    const mailDescription = c('Info')
        .t`With groups, you can quickly and easily send emails to all the people in a specified group.`;
    const genericDescription = c('Info')
        .t`With groups, you can implement the company security policies for access control and reduce the risk of accessing unauthorised data.`;

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsParagraph className="flex flex-column flex-nowrap" learnMoreUrl={getKnowledgeBaseUrl('/groups')}>
                {showMail ? mailDescription : genericDescription}
            </SettingsParagraph>
            {!hasUsableDomain && (
                <SettingsParagraph>
                    {c('Info')
                        .jt`A custom domain is required to create groups. If you don’t have a custom domain set up, do so first under ${linkToDomainPage}.`}
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
            {isAdmin && (
                <Button
                    className="group-button flex flex-row flex-nowrap items-center px-3"
                    disabled={!hasUsableDomain || canOnlyDelete}
                    onClick={() => {
                        actions.onCreateGroup();
                    }}
                >
                    <IcPlus className="shrink-0 mr-2" />
                    {c('Action').t`New group`}
                </Button>
            )}
            {(hasUsableDomain || usingGroupsDomainButNotActive) && (
                <div className="content flex-1 overflow-hidden mt-4 h-custom" style={{ '--h-custom': '95%' }}>
                    <div className="flex flex-nowrap flex-column h-full">
                        <div className="flex items-center justify-start flex-nowrap w-full h-full">
                            <DualPaneSidebar>
                                <GroupList groupsManagement={groupsManagement} canOnlyDelete={canOnlyDelete} />
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

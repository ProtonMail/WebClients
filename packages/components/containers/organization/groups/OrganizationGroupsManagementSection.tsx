import { c } from 'ttag';

import { Button, Card, DualPaneContent, DualPaneSidebar } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import canUseGroups from '@proton/components/containers/organization/groups/canUseGroups';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import { useFlag } from '@proton/unleash';

import GroupForm from './GroupForm';
import GroupList from './GroupList';
import useGroupsManagement from './useGroupsManagement';

import './OrganizationGroupsManagementSection.scss';

interface Props {
    organization?: Organization;
}

const OrganizationGroupsManagementSection = ({ organization }: Props) => {
    const groupsManagement = useGroupsManagement(organization);
    const isUserGroupsNoCustomDomainEnabled = useFlag('UserGroupsNoCustomDomain');

    if (!groupsManagement) {
        return <Loader />;
    }
    const {
        groups,
        domainData: { customDomains },
        suggestedAddressDomainSource,
        actions,
    } = groupsManagement;
    const hasUsableDomain = customDomains?.some(getIsDomainActive) || isUserGroupsNoCustomDomainEnabled;

    const linkToDomainPage = (
        <SettingsLink key="link-to-domain-page" path="/domain-names">{c('Action').t`Domain name`}</SettingsLink>
    );

    const usingGroupsDomainButNotActive =
        suggestedAddressDomainSource === 'group' && !isUserGroupsNoCustomDomainEnabled;
    const canOnlyDelete =
        (!canUseGroups(organization?.PlanName, { isUserGroupsNoCustomDomainEnabled }) ||
            usingGroupsDomainButNotActive) &&
        (groups?.length ?? 0) > 0;

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsParagraph className="flex flex-column flex-nowrap" learnMoreUrl={getKnowledgeBaseUrl('/groups')}>
                {c('Info')
                    .t`With groups, you can quickly and easily send emails to all the people in a specified group.`}
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
            <Button
                className="group-button flex flex-row flex-nowrap items-center px-3"
                disabled={!hasUsableDomain || canOnlyDelete}
                onClick={() => {
                    actions.onCreateGroup();
                }}
            >
                <Icon className="shrink-0 mr-2" name="plus" />
                {c('Action').t`New group`}
            </Button>
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

import { c } from 'ttag';

import { Button, DualPaneContent, DualPaneSidebar } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

import GroupForm from './GroupForm';
import GroupList from './GroupList';
import useGroupsManagement, { INITIAL_FORM_VALUES } from './useGroupsManagement';

import './OrganizationGroupsManagementSection.scss';

interface Props {
    organization?: Organization;
}

const OrganizationGroupsManagementSection = ({ organization }: Props) => {
    const groupsManagement = useGroupsManagement(organization);

    if (!groupsManagement) {
        return <Loader />;
    }
    const { form, setUiState, domainData, setSelectedGroup } = groupsManagement;
    const { customDomains } = domainData;
    const { resetForm, values: formValues } = form;
    const hasAtLeastOneVerifiedCustomDomain = customDomains?.some(getIsDomainActive);

    const newGroupData = {
        ID: 'new',
        Name: formValues.name || c('Empty group name').t`Unnamed`,
        Description: formValues.description,
        Address: {
            Email: formValues.address || '',
        },
        MemberCount: undefined,
    };

    const linkToDomainPage = <SettingsLink path="/domain-names">{c('Action').t`Domain name`}</SettingsLink>;

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsParagraph className="flex flex-column flex-nowrap" learnMoreUrl={getKnowledgeBaseUrl('/groups')}>
                {c('Info')
                    .t`With groups, you can quickly and easily send emails to all the people in a specified group.`}
            </SettingsParagraph>
            {!hasAtLeastOneVerifiedCustomDomain && (
                <SettingsParagraph>
                    {c('Info')
                        .jt`A custom domain is required to create groups. If you don’t have a custom domain set up, do so first under ${linkToDomainPage}.`}
                </SettingsParagraph>
            )}
            <Button
                className="group-button flex flex-row flex-nowrap items-center px-3"
                disabled={!hasAtLeastOneVerifiedCustomDomain}
                onClick={() => {
                    setUiState('new');
                    resetForm({
                        values: INITIAL_FORM_VALUES,
                    });
                    setSelectedGroup(newGroupData);
                }}
            >
                <Icon className="shrink-0 mr-2" name="plus" />
                {c('Action').t`New group`}
            </Button>
            {hasAtLeastOneVerifiedCustomDomain && (
                <div className="content flex-1 overflow-hidden h-full mt-4 h-custom" style={{ '--h-custom': '85%' }}>
                    <div className="flex flex-nowrap flex-column h-full">
                        <div className="flex items-center justify-start flex-nowrap w-full h-full">
                            <DualPaneSidebar>
                                <GroupList groupsManagement={groupsManagement} />
                            </DualPaneSidebar>
                            <DualPaneContent>
                                <GroupForm groupsManagement={groupsManagement} />
                            </DualPaneContent>
                        </div>
                    </div>
                </div>
            )}
        </SettingsSectionWide>
    );
};

export default OrganizationGroupsManagementSection;

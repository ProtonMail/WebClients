import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DualPaneContent, DualPaneSidebar } from '@proton/atoms/DualPane';
import { Loader, SettingsParagraph, SettingsSectionWide } from '@proton/components';
import { Icon } from '@proton/components/components';
import type { Organization } from '@proton/shared/lib/interfaces';
import { GroupPermissions } from '@proton/shared/lib/interfaces';

import GroupForm from './GroupForm';
import GroupList from './GroupList';
import useGroupsManagement from './useGroupsManagement';

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
    const { selectedDomain } = domainData;

    const { resetForm, values: formValues } = form;

    const newGroupData = {
        ID: 'new',
        Name: formValues.name === '' ? c('Empty group name').t`Unnamed` : formValues.name,
        Description: formValues.description,
        Address: {
            Email: formValues.address !== '' ? `${formValues.address}@${selectedDomain}` : '',
        },
        MemberCount: undefined,
    };

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsParagraph className="flex flex-column flex-nowrap" learnMoreUrl="https://proton.me">
                {c('Info')
                    .t`With user groups, you can easily send emails, share data, or change the settings for specific groups of users all at once.`}
            </SettingsParagraph>
            <Button
                className="flex flex-row flex-nowrap items-center px-3"
                onClick={() => {
                    setUiState('new');
                    resetForm({
                        values: {
                            name: '',
                            description: '',
                            address: '',
                            permissions: GroupPermissions.NobodyCanSend,
                            members: '',
                        },
                    });
                    setSelectedGroup(newGroupData);
                }}
            >
                <Icon className="shrink-0 mr-2" name="plus" />
                {c('Action').t`New group`}
            </Button>
            <div className="content flex-1 overflow-hidden h-full mt-4">
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
        </SettingsSectionWide>
    );
};

export default OrganizationGroupsManagementSection;

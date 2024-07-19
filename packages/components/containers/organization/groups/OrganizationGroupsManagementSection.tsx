import { c } from 'ttag';

import { DualPaneContent, DualPaneSidebar } from '@proton/atoms/DualPane';
import { Loader, SettingsParagraph, SettingsSectionWide } from '@proton/components';
import type { Organization } from '@proton/shared/lib/interfaces';

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

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsParagraph learnMoreUrl="https://proton.me">
                {c('Info')
                    .t`With user groups, you can easily send emails, share data, or change the settings for specific groups of users all at once.`}
            </SettingsParagraph>
            <div className="content flex-1 overflow-hidden h-full">
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

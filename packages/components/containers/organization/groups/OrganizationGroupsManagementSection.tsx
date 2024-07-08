import { c } from 'ttag';

import { SettingsParagraph, SettingsSectionWide } from '@proton/components';

import './OrganizationGroupsManagementSection.scss';

interface Props {}

const OrganizationGroupsManagementSection = ({}: Props) => {
    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsParagraph learnMoreUrl="https://proton.me">
                {c('Info')
                    .t`With user groups, you can easily send emails, share data, or change the settings for specific groups of users all at once.`}
            </SettingsParagraph>
            <div className="content flex-1 overflow-hidden h-full">
                <div className="flex flex-nowrap flex-column h-full">
                    <div className="flex items-center justify-start flex-nowrap w-full h-full"></div>
                </div>
            </div>
        </SettingsSectionWide>
    );
};

export default OrganizationGroupsManagementSection;

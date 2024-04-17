import { SettingsPageTitle, SettingsParagraph, SettingsSectionWide } from '@proton/components/containers/account';

import { PlanConfigReminder } from './interface';

const ReminderSectionPlan = ({ title, description }: PlanConfigReminder) => {
    return (
        <SettingsSectionWide className="mt-14 container-section-sticky-section">
            <SettingsPageTitle className="mb-5">{title}</SettingsPageTitle>
            <SettingsParagraph>{description}</SettingsParagraph>
        </SettingsSectionWide>
    );
};

export default ReminderSectionPlan;

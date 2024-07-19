import { SettingsPageTitle, SettingsSectionWide } from '@proton/components/containers/account';

import type { PlanConfigReminder } from './interface';

const ReminderSectionPlan = ({ title }: PlanConfigReminder) => {
    return (
        <SettingsSectionWide className="mt-14 container-section-sticky-section" data-testid="cancellation-flow:heading">
            <SettingsPageTitle className="mb-5">{title}</SettingsPageTitle>
        </SettingsSectionWide>
    );
};

export default ReminderSectionPlan;

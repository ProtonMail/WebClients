import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';

import type { PlanConfigReminder } from './interface';

const ReminderSectionPlan = ({ title }: PlanConfigReminder) => {
    return (
        <SettingsSectionWide className="mt-14 flex justify-center" style={{ '--max-w-custom': '100%' }}>
            <SettingsPageTitle className="mb-5">{title}</SettingsPageTitle>
        </SettingsSectionWide>
    );
};

export default ReminderSectionPlan;

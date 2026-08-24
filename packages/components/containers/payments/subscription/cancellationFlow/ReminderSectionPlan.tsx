import SettingsPageTitle from '../../../account/SettingsPageTitle';
import SettingsSectionWide from '../../../account/SettingsSectionWide';
import type { PlanConfigReminder } from './interface';

const ReminderSectionPlan = ({ title }: PlanConfigReminder) => {
    return (
        <SettingsSectionWide className="mt-14 flex justify-center" style={{ '--max-w-custom': '100%' }}>
            <SettingsPageTitle className="mb-5">{title}</SettingsPageTitle>
        </SettingsSectionWide>
    );
};

export default ReminderSectionPlan;

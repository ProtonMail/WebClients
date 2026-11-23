import type { Ref } from 'react';

import SettingsPageTitle from '../../../account/SettingsPageTitle';
import SettingsSectionWide from '../../../account/SettingsSectionWide';
import type { PlanConfigReminder } from './interface';

interface Props extends PlanConfigReminder {
    /** Receives focus when the page is opened from the sidebar */
    titleRef?: Ref<HTMLHeadingElement>;
}

const ReminderSectionPlan = ({ title, titleRef }: Props) => {
    return (
        <SettingsSectionWide className="mt-14 flex justify-center" style={{ '--max-w-custom': '100%' }}>
            <SettingsPageTitle ref={titleRef} tabIndex={-1} className="mb-5 outline-none--at-all">
                {title}
            </SettingsPageTitle>
        </SettingsSectionWide>
    );
};

export default ReminderSectionPlan;

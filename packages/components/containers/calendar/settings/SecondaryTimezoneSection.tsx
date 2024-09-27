import { c } from 'ttag';

import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SecondaryTimezoneSelector from '@proton/components/containers/calendar/settings/SecondaryTimezoneSelector';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const SecondaryTimezoneSection = ({ calendarUserSettings }: Props) => {
    const timeZoneSelectorId = 'secondary-timezone';

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor={timeZoneSelectorId} id="label-secondary-timezone">
                    <span className="mr-2">{c('Primary timezone').t`Secondary time zone`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <SecondaryTimezoneSelector
                    id={timeZoneSelectorId}
                    calendarUserSettings={calendarUserSettings}
                    data-testid="settings/secondary-time-zone:dropdown"
                    ariaDescribedBy="label-secondary-timezone"
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default SecondaryTimezoneSection;

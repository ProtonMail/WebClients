import { c } from 'ttag';

import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import SecondaryTimezoneSelector from './SecondaryTimezoneSelector';

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
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default SecondaryTimezoneSection;

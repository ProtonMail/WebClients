import { c } from 'ttag';

import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import PrimaryTimezoneSelector from './PrimaryTimezoneSelector';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const PrimaryTimezoneSection = ({ calendarUserSettings }: Props) => {
    const timeZoneSelectorId = 'primary-timezone';

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor={timeZoneSelectorId} id="label-primary-timezone">
                    <span className="mr-2">{c('Primary timezone').t`Primary time zone`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <PrimaryTimezoneSelector
                    id={timeZoneSelectorId}
                    calendarUserSettings={calendarUserSettings}
                    data-testid="settings/primary-time-zone:dropdown"
                    ariaDescribedBy="label-primary-timezone"
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default PrimaryTimezoneSection;

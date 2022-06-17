import { c } from 'ttag';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { Info } from '../../../components';

import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import AutoDetectPrimaryTimezoneToggle from './AutoDetectPrimaryTimezoneToggle';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const AutoDetectPrimaryTimezoneSection = ({ calendarUserSettings }: Props) => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label
                    className="text-semibold"
                    htmlFor="autodetect-primary-timezone"
                    id="label-autodetect-primary-timezone"
                >
                    <span className="mr0-5">{c('Label').t`Auto-detect primary time zone`}</span>
                    <Info
                        title={c('Info')
                            .t`If the system time zone does not match the current time zone preference, you will be asked to update it (at most once per day).`}
                    />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight className="pt0-5 flex flex-align-items-center">
                <AutoDetectPrimaryTimezoneToggle calendarUserSettings={calendarUserSettings} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default AutoDetectPrimaryTimezoneSection;

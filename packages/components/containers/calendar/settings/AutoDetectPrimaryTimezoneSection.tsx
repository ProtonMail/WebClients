import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const AutoDetectPrimaryTimezoneSection = ({ calendarUserSettings }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingAutoDetect, withLoadingAutoDetect] = useLoading();
    const checked = !!calendarUserSettings.AutoDetectPrimaryTimezone;

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label
                    className="text-semibold"
                    htmlFor="autodetect-primary-timezone"
                    id="label-autodetect-primary-timezone"
                >
                    <span className="mr-2">{c('Label').t`Auto-detect primary time zone`}</span>
                    <Info
                        title={c('Info')
                            .t`If the system time zone does not match the current time zone preference, you will be asked to update it (at most once per day).`}
                    />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    id="autodetect-primary-timezone"
                    aria-describedby="autodetect-primary-timezone"
                    loading={loadingAutoDetect}
                    checked={checked}
                    onChange={({ target }) =>
                        withLoadingAutoDetect(
                            handleChange({
                                AutoDetectPrimaryTimezone: +target.checked,
                            })
                        )
                    }
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default AutoDetectPrimaryTimezoneSection;

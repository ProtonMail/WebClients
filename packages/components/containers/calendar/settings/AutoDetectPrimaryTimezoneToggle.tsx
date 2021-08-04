import { c } from 'ttag';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { useApi, useEventManager, useLoading, useNotifications } from '../../../hooks';
import { Toggle, Info } from '../../../components';

import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const AutoDetectPrimaryTimezoneToggle = ({
    calendarUserSettings: { PrimaryTimezone, AutoDetectPrimaryTimezone },
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingAutoDetect, withLoadingAutoDetect] = useLoading();

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
                    <span className="mr0-5">{c('Label').t`Auto-detect primary time zone`}</span>
                    <Info
                        title={c('Info')
                            .t`If the system time zone does not match the current time zone preference, you will be asked to update it (at most once per day).`}
                    />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight className="pt0-5 flex flex-align-items-center">
                <Toggle
                    id="autodetect-primary-timezone"
                    aria-describedby="autodetect-primary-timezone"
                    loading={loadingAutoDetect}
                    checked={!!AutoDetectPrimaryTimezone}
                    onChange={({ target }) =>
                        withLoadingAutoDetect(
                            handleChange({
                                AutoDetectPrimaryTimezone: +target.checked,
                                // Set a timezone if it's the first time
                                PrimaryTimezone: !PrimaryTimezone ? PrimaryTimezone : undefined,
                            })
                        )
                    }
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default AutoDetectPrimaryTimezoneToggle;

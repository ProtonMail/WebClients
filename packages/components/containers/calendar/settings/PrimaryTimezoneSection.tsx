import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { TimeZoneSelector } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const PrimaryTimezoneSection = ({ calendarUserSettings: { PrimaryTimezone } }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingPrimaryTimeZone, withLoadingPrimaryTimeZone] = useLoading();

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const timeZoneSelectorId = 'primary-timezone';

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor={timeZoneSelectorId} id="label-primary-timezone">
                    <span className="mr-2">{c('Primary timezone').t`Primary time zone`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <TimeZoneSelector
                    id={timeZoneSelectorId}
                    data-testid="settings/primary-time-zone:dropdown"
                    loading={loadingPrimaryTimeZone}
                    timezone={PrimaryTimezone}
                    onChange={(PrimaryTimezone) => withLoadingPrimaryTimeZone(handleChange({ PrimaryTimezone }))}
                    telemetrySource="primary_timezone"
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default PrimaryTimezoneSection;

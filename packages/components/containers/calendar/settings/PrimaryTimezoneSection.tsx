import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { c } from 'ttag';

import { useApi, useEventManager, useLoading, useNotifications } from '../../../hooks';

import { TimeZoneSelector } from '../../../components';

import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayout from '../../account/SettingsLayout';
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

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="primary-timezone" id="label-primary-timezone">
                    <span className="mr0-5">{c('Primary timezone').t`Primary time zone`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <TimeZoneSelector
                    data-test-id="settings/primary-time-zone:dropdown"
                    loading={loadingPrimaryTimeZone}
                    timezone={PrimaryTimezone}
                    onChange={(PrimaryTimezone) => withLoadingPrimaryTimeZone(handleChange({ PrimaryTimezone }))}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default PrimaryTimezoneSection;

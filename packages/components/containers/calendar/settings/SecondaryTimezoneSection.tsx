import { useState } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { TimeZoneSelector } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const SecondaryTimezoneSection = ({ calendarUserSettings: { SecondaryTimezone, DisplaySecondaryTimezone } }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingSecondaryTimeZone, withLoadingSecondaryTimeZone] = useLoading();

    const [timezone] = useState(() => getTimezone());

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const timeZoneSelectorId = 'secondary-timezone';

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor={timeZoneSelectorId} id="label-secondary-timezone">
                    <span className="mr-2">{c('Primary timezone').t`Secondary time zone`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <TimeZoneSelector
                    id={timeZoneSelectorId}
                    data-testid="settings/secondary-time-zone:dropdown"
                    loading={loadingSecondaryTimeZone}
                    disabled={!DisplaySecondaryTimezone}
                    timezone={SecondaryTimezone || timezone}
                    onChange={(SecondaryTimezone) => withLoadingSecondaryTimeZone(handleChange({ SecondaryTimezone }))}
                    telemetrySource="secondary_timezone"
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default SecondaryTimezoneSection;

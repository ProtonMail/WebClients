import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { useState } from 'react';
import { c } from 'ttag';

import { useApi, useEventManager, useLoading, useNotifications } from '../../../hooks';
import { TimeZoneSelector } from '../../../components';

import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayout from '../../account/SettingsLayout';
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
    const secondaryTimezoneValue = DisplaySecondaryTimezone
        ? SecondaryTimezone || timezone
        : SecondaryTimezone || timezone;

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="secondary-timezone" id="label-secondary-timezone">
                    <span className="mr0-5">{c('Primary timezone').t`Secondary time zone`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <TimeZoneSelector
                    data-test-id="settings/secondary-time-zone:dropdown"
                    loading={loadingSecondaryTimeZone}
                    disabled={!DisplaySecondaryTimezone}
                    timezone={secondaryTimezoneValue}
                    onChange={(SecondaryTimezone) => withLoadingSecondaryTimeZone(handleChange({ SecondaryTimezone }))}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default SecondaryTimezoneSection;

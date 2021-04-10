import { updateCalendarUserSettings } from 'proton-shared/lib/api/calendars';
import { getTimezone } from 'proton-shared/lib/date/timezone';
import { CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import React, { useState } from 'react';
import { c } from 'ttag';

import { useApi, useEventManager, useLoading, useNotifications } from '../../../hooks';
import { Toggle } from '../../../components';

import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayout from '../../account/SettingsLayout';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const ShowSecondaryTimezoneToggle = ({
    calendarUserSettings: { DisplaySecondaryTimezone, SecondaryTimezone },
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingDisplaySecondaryTimezone, withLoadingDisplaySecondaryTimezone] = useLoading();
    const [timezone] = useState(() => getTimezone());

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const secondaryTimezoneValue = DisplaySecondaryTimezone
        ? SecondaryTimezone || timezone
        : SecondaryTimezone || timezone;

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="show-secondary-timezone" id="label-show-secondary-timezone">
                    <span className="mr0-5">{c('Label').t`Show secondary time zone`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight className="pt0-5 flex flex-align-items-center">
                <Toggle
                    id="show-secondary-timezone"
                    aria-describedby="show-secondary-timezone"
                    loading={loadingDisplaySecondaryTimezone}
                    checked={!!DisplaySecondaryTimezone}
                    onChange={({ target }) =>
                        withLoadingDisplaySecondaryTimezone(
                            handleChange({
                                DisplaySecondaryTimezone: +target.checked,
                                // Set a timezone if it's the first time
                                SecondaryTimezone: !SecondaryTimezone ? secondaryTimezoneValue : undefined,
                            })
                        )
                    }
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default ShowSecondaryTimezoneToggle;

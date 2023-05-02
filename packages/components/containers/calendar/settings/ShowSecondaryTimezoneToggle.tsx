import {useState} from "react";
import {c} from "ttag";

import { useLoading } from '@proton/hooks';
import {Toggle} from "@proton/components/components";
import {useApi, useEventManager, useNotifications} from "@proton/components/hooks";
import {getTimezone} from "@proton/shared/lib/date/timezone";
import {CalendarUserSettings} from "@proton/shared/lib/interfaces/calendar";
import {updateCalendarUserSettings} from "@proton/shared/lib/api/calendars";

interface Props {
    calendarUserSettings: CalendarUserSettings
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

    const secondaryTimezoneValue = SecondaryTimezone || timezone;


    return (
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
    );
};

export default ShowSecondaryTimezoneToggle;

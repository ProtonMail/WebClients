import { useState } from 'react';

import { c } from 'ttag';

import { DropdownSizeUnit, TimeZoneSelector } from '@proton/components/components';
import { Unit } from '@proton/components/components/dropdown/utils';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks/index';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { AbbreviatedTimezone, getTimezone } from '@proton/shared/lib/date/timezone';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    id: string;
    calendarUserSettings: CalendarUserSettings;
    className?: string;
    abbreviatedTimezone?: AbbreviatedTimezone;
    unstyledSelect?: boolean;
    selectMaxHeight?: DropdownSizeUnit.Viewport | Unit;
    tooltip?: boolean;
    ['data-testid']?: string;
}

const SecondaryTimezoneSelector = ({
    id,
    calendarUserSettings: { DisplaySecondaryTimezone, SecondaryTimezone },
    className,
    abbreviatedTimezone,
    unstyledSelect,
    selectMaxHeight,
    tooltip,
    'data-testid': dataTestId,
}: Props) => {
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

    return (
        <TimeZoneSelector
            id={id}
            data-testid={dataTestId}
            loading={loadingSecondaryTimeZone}
            disabled={!DisplaySecondaryTimezone}
            timezone={SecondaryTimezone || timezone}
            onChange={(SecondaryTimezone) => withLoadingSecondaryTimeZone(handleChange({ SecondaryTimezone }))}
            telemetrySource="secondary_timezone"
            className={className}
            abbreviatedTimezone={abbreviatedTimezone}
            unstyledSelect={unstyledSelect}
            selectMaxHeight={selectMaxHeight}
            tooltip={tooltip}
        />
    );
};

export default SecondaryTimezoneSelector;

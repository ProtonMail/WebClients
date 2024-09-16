import { useState } from 'react';

import { c } from 'ttag';

import type { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { Unit } from '@proton/components/components/dropdown/utils';
import TimeZoneSelector from '@proton/components/components/timezoneSelector/TimeZoneSelector';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import type { AbbreviatedTimezone } from '@proton/shared/lib/date/timezone';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    id: string;
    calendarUserSettings: CalendarUserSettings;
    className?: string;
    abbreviatedTimezone?: AbbreviatedTimezone;
    unstyledSelect?: boolean;
    selectMaxHeight?: DropdownSizeUnit.Viewport | Unit;
    tooltip?: boolean;
    ['data-testid']?: string;
    ariaDescribedBy?: string;
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
    ariaDescribedBy,
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
            aria-describedby={ariaDescribedBy}
        />
    );
};

export default SecondaryTimezoneSelector;

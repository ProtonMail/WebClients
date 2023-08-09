import { c } from 'ttag';

import { DropdownSizeUnit, TimeZoneSelector } from '@proton/components/components';
import { Unit } from '@proton/components/components/dropdown/utils';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks/index';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { AbbreviatedTimezone } from '@proton/shared/lib/date/timezone';
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
const PrimaryTimezoneSelector = ({
    id,
    calendarUserSettings: { PrimaryTimezone },
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
    const [loadingPrimaryTimeZone, withLoadingPrimaryTimeZone] = useLoading();

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <TimeZoneSelector
            id={id}
            data-testid={dataTestId}
            loading={loadingPrimaryTimeZone}
            timezone={PrimaryTimezone}
            onChange={(PrimaryTimezone) => withLoadingPrimaryTimeZone(handleChange({ PrimaryTimezone }))}
            telemetrySource="primary_timezone"
            className={className}
            abbreviatedTimezone={abbreviatedTimezone}
            unstyledSelect={unstyledSelect}
            selectMaxHeight={selectMaxHeight}
            tooltip={tooltip}
        />
    );
};

export default PrimaryTimezoneSelector;

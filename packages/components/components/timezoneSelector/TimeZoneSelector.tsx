import { useMemo } from 'react';

import { c } from 'ttag';

import { TelemetryCalendarEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { SimpleMap } from '@proton/shared/lib/interfaces';

import { useApi } from '../../hooks';
import { Option } from '../option';
import { SearchableSelect } from '../selectTwo';
import { Props as SelectProps } from '../selectTwo/SelectTwo';

interface Props extends Omit<SelectProps<string>, 'onChange' | 'children'> {
    timezone?: string;
    onChange: (tzid: string) => void;
    className?: string;
    defaultTimezone?: string;
    disabled?: boolean;
    date?: Date;
    loading?: boolean;
    telemetrySource?: string;
}
export const TimeZoneSelector = ({
    loading = false,
    disabled = false,
    telemetrySource,
    date,
    timezone,
    onChange,
    ...rest
}: Props) => {
    const api = useApi();

    const timezoneOptions = useMemo(() => {
        const options = getTimeZoneOptions(date || new Date());

        return options.map(({ text, value, key }) => <Option key={key} value={value} title={text} />);
    }, [date]);

    const handleChange = ({ value }: { value: string }) => {
        if (telemetrySource) {
            const dimensions: SimpleMap<string> = {
                timezone_from: timezone,
                timezone_to: value,
                source: telemetrySource,
            };
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.calendarTimeZoneSelector,
                event: TelemetryCalendarEvents.change_temporary_time_zone,
                dimensions,
            });
        }
        onChange(value);
    };

    return (
        <SearchableSelect
            disabled={loading || disabled}
            title={c('Action').t`Select time zone`}
            value={timezone}
            onChange={handleChange}
            search
            searchPlaceholder={c('Timezone search placeholder').t`Search time zones`}
            {...rest}
        >
            {timezoneOptions}
        </SearchableSelect>
    );
};

export default TimeZoneSelector;

import { useMemo, useState } from 'react';

import { c } from 'ttag';

import type { Unit } from '@proton/components/components/dropdown/utils';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Option from '@proton/components/components/option/Option';
import type { SearcheableSelectProps } from '@proton/components/components/selectTwo/SearchableSelect';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { TelemetryCalendarEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { AbbreviatedTimezone } from '@proton/shared/lib/date/timezone';
import { getAbbreviatedTimezoneName, getTimeZoneOptions, getTimezoneAndOffset } from '@proton/shared/lib/date/timezone';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

import { useApi } from '../../hooks';
import type { SelectTwoProps } from '../selectTwo/SelectTwo';

interface Props extends Omit<SelectTwoProps<string>, 'onChange' | 'children'> {
    timezone?: string;
    onChange: (tzid: string) => void;
    className?: string;
    defaultTimezone?: string;
    disabled?: boolean;
    date?: Date;
    loading?: boolean;
    telemetrySource?: string;
    abbreviatedTimezone?: AbbreviatedTimezone;
    unstyledSelect?: boolean;
    selectMaxHeight?: DropdownSizeUnit.Viewport | Unit;
    tooltip?: boolean;
}
export const TimeZoneSelector = ({
    loading = false,
    disabled = false,
    telemetrySource,
    date,
    timezone,
    onChange,
    abbreviatedTimezone,
    unstyledSelect,
    selectMaxHeight,
    tooltip = false,
    ...rest
}: Props) => {
    const api = useApi();
    const [selectIsOpen, setSelectIsOpen] = useState(false);

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

    const searchableSelectProps: SearcheableSelectProps<string> = {
        disabled: loading || disabled,
        title: c('Action').t`Select time zone`,
        value: timezone,
        onChange: handleChange,
        onOpen: () => setSelectIsOpen(true),
        onClose: () => setSelectIsOpen(false),
        search: true,
        searchPlaceholder: c('Timezone search placeholder').t`Search time zones`,
        size: {
            width: DropdownSizeUnit.Dynamic,
            height: DropdownSizeUnit.Dynamic,
            maxHeight: selectMaxHeight ? selectMaxHeight : undefined,
        },
        unstyled: unstyledSelect,
        renderSelected: () =>
            abbreviatedTimezone ? getAbbreviatedTimezoneName(abbreviatedTimezone, timezone) : undefined,
        originalPlacement: 'bottom-start',
        ...rest,
        children: timezoneOptions,
    };

    return (
        <>
            {tooltip ? (
                <Tooltip title={getTimezoneAndOffset(timezone || '')} isOpen={selectIsOpen ? false : undefined}>
                    <div>
                        <SearchableSelect {...searchableSelectProps} />
                    </div>
                </Tooltip>
            ) : (
                <SearchableSelect {...searchableSelectProps} />
            )}
        </>
    );
};

export default TimeZoneSelector;

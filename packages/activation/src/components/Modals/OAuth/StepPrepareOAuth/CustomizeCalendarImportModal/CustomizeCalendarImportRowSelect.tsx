import { c } from 'ttag';

import { CALENDAR_TO_BE_CREATED_PREFIX } from '@proton/activation/src/constants';
import type { ImporterCalendar } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { LabelStack, Option, SelectTwo } from '@proton/components';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

interface Props {
    calendar: ImporterCalendar;
    calendarLimitReached: boolean;
    activeCalendars: VisualCalendar[];
    updateCalendarMapping: (calendar: ImporterCalendar, destinationCalendar?: VisualCalendar) => void;
}

const CustomizeCalendarImportRowSelect = ({
    calendar,
    calendarLimitReached,
    activeCalendars,
    updateCalendarMapping,
}: Props) => {
    const { source } = calendar;

    const options = activeCalendars.map(({ ID, Name }) => <Option key={ID} value={ID} title={Name} />);

    const calendarToBeCreatedValue = `${CALENDAR_TO_BE_CREATED_PREFIX}${calendar.source}`;
    const value = calendar.mergedTo ? calendar.mergedTo.ID : calendar.source;

    // translator; when managing calendar import, calendars can be created or merged. The text is displayed next to the calendar row and the value can be "merged" (this case) or "new"
    const mergedLabel = c('Info').t`Merged`;
    // translator; when managing calendar import, calendars can be created or merged. The text is displayed next to the calendar row and the value can be "merged" or "new" (this case)
    const newLabel = c('Info').t`New`;

    const newMergeLabel = (
        <LabelStack
            labels={[
                {
                    name: !!calendar.mergedTo ? mergedLabel : newLabel,
                },
            ]}
        />
    );

    const handleMappingChange = (id: string) => {
        const selectedActiveCalendar = activeCalendars.find((cal) => cal.ID === id);
        updateCalendarMapping(calendar, selectedActiveCalendar);
    };

    const createNewCalendarLabel = c('Option group label').t`Create new calendar`;
    const mergeCalendarLabel = c('Option group label').t`Merge with calendar`;

    return (
        <div className="flex flex-nowrap">
            {options.length > 0 ? (
                <>
                    <div className="flex-1 mr-4">
                        <SelectTwo
                            value={value}
                            onChange={({ value }) => handleMappingChange(value)}
                            className={clsx([calendarLimitReached && 'border-danger'])}
                        >
                            {[
                                <li className="dropdown-item" key="label-create">
                                    <span
                                        className="w-full px-4 py-2 block text-ellipsis text-left outline-none text-semibold"
                                        title={createNewCalendarLabel}
                                    >
                                        {createNewCalendarLabel}
                                    </span>
                                </li>,

                                <Option
                                    key={calendarToBeCreatedValue}
                                    value={calendar.source}
                                    title={source}
                                    truncate
                                />,

                                <hr key="separator" className="my-2" />,

                                <li className="dropdown-item" key="label-merge">
                                    <span
                                        className="w-full px-4 py-2 block text-ellipsis text-left outline-none text-semibold"
                                        title={mergeCalendarLabel}
                                    >
                                        {mergeCalendarLabel}
                                    </span>
                                </li>,
                                ...options,
                            ]}
                        </SelectTwo>
                    </div>
                    <div className="shrink-0 self-center">{newMergeLabel}</div>
                </>
            ) : (
                <>
                    <div className="mr-4 text-ellipsis" title={source}>
                        {source}
                    </div>
                    <div className="shrink-0 self-center">{newMergeLabel}</div>
                </>
            )}
        </div>
    );
};

export default CustomizeCalendarImportRowSelect;

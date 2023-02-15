import { c } from 'ttag';

import { CALENDAR_TO_BE_CREATED_PREFIX } from '@proton/activation/constants';
import { ImporterCalendar } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.interface';
import { LabelStack, Option, SelectTwo } from '@proton/components/components';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
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

    const newMergeLabel = (
        <LabelStack
            labels={[
                {
                    name: !!calendar.mergedTo ? c('Info').t`Merged` : c('Info').t`New`,
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
                    <div className="flex-item-fluid mr1">
                        <SelectTwo
                            value={value}
                            onChange={({ value }) => handleMappingChange(value)}
                            className={clsx([calendarLimitReached && 'border-danger'])}
                        >
                            {[
                                <li className="dropdown-item" key="label-create">
                                    <span
                                        className="w100 pr1 pl1 pt0-5 pb0-5 block text-ellipsis text-left outline-none text-semibold"
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

                                <hr key="separator" className="mt0-5 mb0-5" />,

                                <li className="dropdown-item" key="label-merge">
                                    <span
                                        className="w100 pr1 pl1 pt0-5 pb0-5 block text-ellipsis text-left outline-none text-semibold"
                                        title={mergeCalendarLabel}
                                    >
                                        {mergeCalendarLabel}
                                    </span>
                                </li>,
                                ...options,
                            ]}
                        </SelectTwo>
                    </div>
                    <div className="flex-item-noshrink flex-align-self-center">{newMergeLabel}</div>
                </>
            ) : (
                <>
                    <div className="mr1 text-ellipsis" title={source}>
                        {source}
                    </div>
                    <div className="flex-item-noshrink flex-align-self-center">{newMergeLabel}</div>
                </>
            )}
        </div>
    );
};

export default CustomizeCalendarImportRowSelect;

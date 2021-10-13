import { c } from 'ttag';

import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { ImportedCalendar } from '@proton/shared/lib/interfaces/EasySwitch';

import { Checkbox, Label, LabelStack, Select } from '../../../../components';
import { classnames } from '../../../../helpers/component';
import { CALENDAR_TO_BE_CREATED_PREFIX } from '../../constants';

interface Props {
    calendar: ImportedCalendar;
    toggleChecked: (calendarID: string) => void;
    checked: boolean;
    calendars: Calendar[];
    updateCalendarMapping: (calendarID: string, destination: string) => void;
    value: string;
    isLast: boolean;
    calendarLimitReached: boolean;
}

const CustomizeCalendarImportRow = ({
    calendar,
    checked,
    toggleChecked,
    calendars,
    updateCalendarMapping,
    value,
    isLast,
    calendarLimitReached,
}: Props) => {
    const options = calendars.map(({ ID, Name }) => ({
        text: Name,
        value: ID,
        group: c('Option group label').t`Merge with calendar`,
    }));

    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) =>
        updateCalendarMapping(calendar.ID, target.value);

    const rightColMappingRenderer = (
        <div className="flex">
            <div className="flex-item-fluid mr1">
                <Select
                    onChange={handleChange}
                    value={value}
                    options={[
                        {
                            value: `${CALENDAR_TO_BE_CREATED_PREFIX}${calendar.Source}`,
                            text: calendar.Source,
                            group: c('Option group label').t`Create new calendar`,
                        },
                        ...options,
                    ]}
                    className={classnames([calendarLimitReached && 'border--danger'])}
                />
            </div>
            <div className="flex-item-noshrink flex-align-self-center">
                <LabelStack
                    labels={[
                        {
                            name:
                                value.replace(CALENDAR_TO_BE_CREATED_PREFIX, '') === calendar.Source
                                    ? c('Info').t`New`
                                    : c('Info').t`Merged`,
                        },
                    ]}
                />
            </div>
        </div>
    );

    return (
        <Label
            htmlFor={calendar.ID}
            className={classnames(['w100 label flex flex-flex-align-items-center pt2 pb2', !isLast && 'border-bottom'])}
        >
            <div className="flex flex-item-fluid">
                <Checkbox
                    id={calendar.ID}
                    checked={checked}
                    onChange={() => toggleChecked(calendar.ID)}
                    className="mr0-5"
                />
                <div>{calendar.Source}</div>
            </div>
            {checked && <div className="flex-item-fluid">{rightColMappingRenderer}</div>}
        </Label>
    );
};

export default CustomizeCalendarImportRow;

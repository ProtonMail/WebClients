import { c } from 'ttag';

import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { ImportedCalendar } from '@proton/shared/lib/interfaces/EasySwitch';

import { Checkbox, Label, LabelStack, SelectTwo, Option } from '../../../../components';
import { classnames } from '../../../../helpers/component';
import { CALENDAR_TO_BE_CREATED_PREFIX } from '../../constants';

interface Props {
    calendar: ImportedCalendar;
    toggleChecked: (calendarID: string) => void;
    checked: boolean;
    activeCalendars: Calendar[];
    updateCalendarMapping: (calendarID: string, destination: string) => void;
    value: string;
    isLast: boolean;
    calendarLimitReached: boolean;
}

const CustomizeCalendarImportRow = ({
    calendar,
    checked,
    toggleChecked,
    activeCalendars,
    updateCalendarMapping,
    value,
    isLast,
    calendarLimitReached,
}: Props) => {
    const options = activeCalendars.map(({ ID, Name }) => <Option key={ID} value={ID} title={Name} />);

    const calendarToBeCreatedValue = `${CALENDAR_TO_BE_CREATED_PREFIX}${calendar.Source}`;

    const newMergeLabel = (
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
    );

    const createNewCalendarLabel = c('Option group label').t`Create new calendar`;
    const mergeCalendarLabel = c('Option group label').t`Merge with calendar`;

    const rightColMappingRenderer = (
        <div className="flex flex-nowrap">
            {options.length > 0 ? (
                <>
                    <div className="flex-item-fluid mr1">
                        <SelectTwo
                            value={value}
                            onChange={({ value }) => updateCalendarMapping(calendar.ID, value)}
                            className={classnames([calendarLimitReached && 'border-danger'])}
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
                                    value={calendarToBeCreatedValue}
                                    title={calendar.Source}
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
                    <div className="mr1 text-ellipsis" title={calendar.Source}>
                        {calendar.Source}
                    </div>
                    <div className="flex-item-noshrink flex-align-self-center">{newMergeLabel}</div>
                </>
            )}
        </div>
    );

    return (
        <Label
            htmlFor={calendar.ID}
            className={classnames(['w100 label flex flex-flex-align-items-center pt2 pb2', !isLast && 'border-bottom'])}
        >
            <div className={classnames(['flex flex-item-fluid', checked && 'mr1'])}>
                <Checkbox
                    id={calendar.ID}
                    checked={checked}
                    onChange={() => toggleChecked(calendar.ID)}
                    className="mr0-5"
                />
                <div className="flex-item-fluid text-ellipsis" title={calendar.Source}>
                    {calendar.Source}
                </div>
            </div>
            {checked && <div className="flex-item-fluid">{rightColMappingRenderer}</div>}
        </Label>
    );
};

export default CustomizeCalendarImportRow;

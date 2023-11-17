import { ImporterCalendar } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { Checkbox, Label } from '@proton/components/components';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import CustomizeCalendarImportRowSelect from './CustomizeCalendarImportRowSelect';

interface Props {
    calendar: ImporterCalendar;
    calendarLimitReached: boolean;
    activeCalendars: VisualCalendar[];
    toggleChecked: (calendar: ImporterCalendar) => void;
    updateCalendarMapping: (calendar: ImporterCalendar, destinationCalendar?: VisualCalendar) => void;
}

const CustomizeCalendarImportRow = ({
    calendar,
    calendarLimitReached,
    activeCalendars,
    toggleChecked,
    updateCalendarMapping,
}: Props) => {
    const { checked, source } = calendar;

    return (
        <Label htmlFor={calendar.id} className="w-full label flex flex-items-center py-7 border-bottom">
            <div className={clsx(['flex flex-item-fluid', checked && 'mr-4'])}>
                <Checkbox
                    id={calendar.id}
                    checked={checked}
                    onChange={() => toggleChecked(calendar)}
                    className="mr-2"
                    data-testid="CustomizeCalendarImportRow:checkbox"
                />
                <div className="flex-item-fluid text-ellipsis" title={source}>
                    {source}
                </div>
            </div>
            {checked && (
                <div className="flex-item-fluid">
                    {
                        <CustomizeCalendarImportRowSelect
                            calendar={calendar}
                            calendarLimitReached={calendarLimitReached}
                            activeCalendars={activeCalendars}
                            updateCalendarMapping={updateCalendarMapping}
                        />
                    }
                </div>
            )}
        </Label>
    );
};

export default CustomizeCalendarImportRow;

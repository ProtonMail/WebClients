import { useState } from 'react';

import { c } from 'ttag';

import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Checkbox from '@proton/components/components/input/Checkbox';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { InputField } from '@proton/components/components/v2/field/InputField';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useBookings } from '../bookingsProvider/BookingsProvider';
import { BookingState } from '../interface';
import { FormIconRow } from './BookingsFormComponents';

export const BookingFormCalendarField = () => {
    const isConflictCalendarsEnabled = useFlag('CalendarBookingsConflictCalendars');
    const { formData, updateFormData, bookingsState } = useBookings();

    const [writeableCalendars = []] = useWriteableCalendars({ canBeDisabled: false, canBeShared: false });
    const selectedCalendar = writeableCalendars.find((calendar) => calendar.ID === formData.selectedCalendar);

    const [hasConflictingCalendarIDs, setHasConflictingCalendarIDs] = useState<boolean>(
        formData.conflictCalendarIDs.length > 0
    );

    const isCalendarSelectDisabled = writeableCalendars.length === 1 || bookingsState === BookingState.EDIT_EXISTING;

    const handleToggleConflictingCalendar = (id: string, checked: boolean) => {
        const currentIDs = formData.conflictCalendarIDs;
        const updatedIDs = checked ? [...currentIDs, id] : currentIDs.filter((calID) => calID !== id);

        updateFormData('conflictCalendarIDs', updatedIDs);
    };

    return (
        <FormIconRow icon={<IcCalendarGrid />} title={c('Info').t`In which calendar should bookings appear?`}>
            <InputField
                as={SelectTwo}
                id="calendar-select"
                value={formData.selectedCalendar}
                label={c('Info').t`In which calendar should bookings appear?`}
                labelContainerClassName="sr-only"
                onChange={({ value }: { value: any }) => {
                    updateFormData('selectedCalendar', value);
                }}
                assistContainerClassName="hidden"
                className={clsx(
                    'max-w-full booking-sidebar-calendar-select',
                    isCalendarSelectDisabled && 'booking-sidebar-calendar-select--disabled'
                )}
                fullWidth={false}
                disabled={isCalendarSelectDisabled}
                size={{ width: DropdownSizeUnit.Static }}
                noDropdownCaret={isCalendarSelectDisabled}
            >
                {writeableCalendars.map((calendar) => (
                    <Option key={calendar.ID} value={calendar.ID} title={calendar.Name}>
                        <div className="flex flex-nowrap items-center gap-2">
                            <span
                                className="h-2 w-2 inline-block rounded-full items-center shrink-0"
                                style={{ backgroundColor: calendar.Color }}
                            />
                            <span className="grow text-ellipsis">{calendar.Name}</span>
                        </div>
                    </Option>
                ))}
            </InputField>
            {selectedCalendar && (
                <p className="m-0 mt-1 text-sm color-weak">
                    {c('Info').t`Booking contact email: ${selectedCalendar.Email}`}
                </p>
            )}

            {isConflictCalendarsEnabled && writeableCalendars.length > 1 && (
                <Checkbox
                    className="gap-0 my-4 text-sm"
                    checked={hasConflictingCalendarIDs}
                    onChange={({ target }) => setHasConflictingCalendarIDs(target.checked)}
                >
                    {c('Label').t`Check additional calendars for availability`}
                </Checkbox>
            )}

            {hasConflictingCalendarIDs && (
                <div className="flex flex-column gap-4 ml-6">
                    <span className="text-sm color-weak">{c('Info').t`Which calendars should block bookings?`}</span>

                    {writeableCalendars.map((calendar) => {
                        const calendarID = calendar.ID;
                        const isSelectedCalendar = calendarID === formData.selectedCalendar;
                        const isChecked = formData.conflictCalendarIDs.includes(calendarID) || isSelectedCalendar;

                        return (
                            <Checkbox
                                key={calendarID}
                                checked={isChecked}
                                className="text-sm"
                                borderColor={isSelectedCalendar ? undefined : calendar?.Color}
                                backgroundColor={isChecked && !isSelectedCalendar ? calendar?.Color : undefined}
                                disabled={isSelectedCalendar}
                                onChange={({ target }) => handleToggleConflictingCalendar(calendarID, target.checked)}
                            >
                                {calendar?.Name}
                            </Checkbox>
                        );
                    })}
                </div>
            )}
        </FormIconRow>
    );
};

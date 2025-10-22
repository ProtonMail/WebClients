import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import Icon from '@proton/components/components/icon/Icon';
import IconRow from '@proton/components/components/iconRow/IconRow';
import { InputFieldTwo, Option, SelectTwo, TimeZoneSelector } from '@proton/components/index';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';

import { useBookings } from './bookingsProvider/BookingsProvider';
import { BookingState } from './bookingsProvider/interface';

export const Form = () => {
    const scheduleOptions = getCalendarEventDefaultDuration();
    const [writeableCalendars = []] = useWriteableCalendars();

    const { formData, updateFormData } = useBookings();

    return (
        <form className="flex flex-column">
            <IconRow icon="earth" title={c('Label').t`Time zone`}>
                <TimeZoneSelector
                    onChange={(value) => updateFormData('timeZone', value)}
                    timezone={formData.timeZone}
                />
            </IconRow>

            <IconRow icon="text-align-left" title={c('Label').t`Title`}>
                <InputFieldTwo
                    id="booking-title"
                    placeholder={c('Placeholder').t`Add title`}
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    maxLength={MAX_CHARS_API.TITLE}
                    assistContainerClassName="hidden"
                    autoFocus
                />
            </IconRow>

            <IconRow icon="clock" title={c('Label').t`Duration`}>
                <InputFieldTwo
                    as={SelectTwo}
                    id="duration-select"
                    value={formData.duration}
                    onChange={({ value }: { value: any }) => {
                        updateFormData('duration', value);
                    }}
                    assistContainerClassName="hidden"
                >
                    {scheduleOptions.map(({ value, text }) => (
                        <Option key={value} value={value} title={text} />
                    ))}
                </InputFieldTwo>
            </IconRow>

            <IconRow icon="calendar-grid" title={c('Label').t`Calendar`}>
                <InputFieldTwo
                    as={SelectTwo}
                    id="calendar-select"
                    value={formData.selectedCalendar}
                    onChange={({ value }: { value: any }) => {
                        updateFormData('selectedCalendar', value);
                    }}
                    assistContainerClassName="hidden"
                >
                    {writeableCalendars.map((calendar) => (
                        <Option key={calendar.ID} value={calendar.ID} title={calendar.Name} />
                    ))}
                </InputFieldTwo>
            </IconRow>
        </form>
    );
};

const Header = () => {
    const { changeBookingState } = useBookings();

    return (
        <div className="flex items-center mb-6 justify-space-between">
            <h2 className="text-bold text-lg">{c('Title').t`Booking page`}</h2>

            <Button icon shape="ghost" onClick={() => changeBookingState(BookingState.OFF)}>
                <Icon name="cross-big" />
            </Button>
        </div>
    );
};

const Buttons = () => {
    const { changeBookingState, submitForm } = useBookings();

    return (
        <div className="flex justify-center gap-6">
            <Button onClick={() => changeBookingState(BookingState.OFF)}>{c('Action').t`Cancel`}</Button>
            <Button className="grow" color="norm" type="submit" onClick={submitForm}>{c('Action')
                .t`Create booking page`}</Button>
        </div>
    );
};

export const BookingManagement = { Form, Buttons, Header };

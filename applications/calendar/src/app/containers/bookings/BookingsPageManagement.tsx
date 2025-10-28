import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import Icon from '@proton/components/components/icon/Icon';
import IconRow from '@proton/components/components/iconRow/IconRow';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { InputFieldTwo, Option, SelectTwo } from '@proton/components/index';
import type { IconName } from '@proton/icons';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';

import { useBookings } from './bookingsProvider/BookingsProvider';
import { BookingState } from './bookingsProvider/interface';

interface FormIconRowProps extends PropsWithChildren {
    title: string;
    hideBorder?: boolean;
    icon: IconName;
}

const FormIconRow = ({ title, icon, children, hideBorder = false }: FormIconRowProps) => {
    return (
        <IconRow icon={icon} containerClassName="items-baseline" labelClassName="pt-0.5">
            <h2 className="text-sm text-semibold mb-2">{title}</h2>
            {children}
            {!hideBorder && <hr className="mt-5 mb-1 bg-weak" />}
        </IconRow>
    );
};

export const Form = () => {
    const scheduleOptions = getCalendarEventDefaultDuration();
    const [writeableCalendars = []] = useWriteableCalendars();

    const { formData, updateFormData } = useBookings();

    return (
        <form className="flex flex-column">
            <FormIconRow icon="text-title" title={c('Info').t`Name your booking page`}>
                <InputFieldTwo
                    id="booking-title"
                    placeholder={c('Placeholder').t`Booking page title`}
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    maxLength={MAX_CHARS_API.TITLE}
                    assistContainerClassName="hidden"
                    inputContainerClassName="text-xl text-semibold"
                    inputClassName="px-0 pt-1 pb-0"
                    unstyled
                    autoFocus
                />
            </FormIconRow>

            <FormIconRow icon="clock" title={c('Info').t`How long should an appointment last?`}>
                <div className="flex gap-1">
                    {scheduleOptions.map(({ value, text }) => (
                        <Button
                            onClick={() => updateFormData('duration', value)}
                            shape={formData.duration === value ? 'solid' : 'outline'}
                            color="weak"
                            pill
                        >
                            {text}
                        </Button>
                    ))}
                </div>
            </FormIconRow>

            <FormIconRow icon="calendar-checkmark" title={c('Info').t`When are you free?`}>
                todo
            </FormIconRow>

            <FormIconRow icon="map-pin" title={c('Info').t`Where will the appointment take place?`}>
                todo
            </FormIconRow>

            <FormIconRow icon="calendar-grid" title={c('Info').t`In which calendar should bookings appear?`}>
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
            </FormIconRow>

            <FormIconRow icon="file-lines" title={c('Info').t`What should people know before booking?`}>
                <TextArea
                    id="booking-description"
                    placeholder={c('Placeholder').t`Add a booking page description`}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={2}
                    maxLength={MAX_CHARS_API.CALENDAR_DESCRIPTION}
                />
            </FormIconRow>

            <FormIconRow icon="shield" title={c('Info').t`Protect this page with a password?`} hideBorder>
                todo
            </FormIconRow>

            <IconRow icon="earth" title={c('Label').t`Time zone`}>
                <TimeZoneSelector
                    onChange={(value) => updateFormData('timezone', value)}
                    timezone={formData.timezone}
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
        <Button icon shape="ghost" onClick={() => changeBookingState(BookingState.OFF)}>
            <Icon name="cross-big" />
        </Button>
    );
};

const Buttons = () => {
    const { changeBookingState, submitForm, loading } = useBookings();

    return (
        <div className="flex justify-center gap-6">
            <Button disabled={loading} onClick={() => changeBookingState(BookingState.OFF)}>{c('Action')
                .t`Cancel`}</Button>
            <Button loading={loading} className="grow" color="norm" type="submit" onClick={submitForm}>{c('Action')
                .t`Create booking page`}</Button>
        </div>
    );
};

export const BookingManagement = { Form, Buttons, Header };

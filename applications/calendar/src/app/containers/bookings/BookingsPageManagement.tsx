import type { PropsWithChildren, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import Icon from '@proton/components/components/icon/Icon';
import IconRow from '@proton/components/components/iconRow/IconRow';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { InputFieldTwo, Option, SelectTwo } from '@proton/components/index';
import type { IconName } from '@proton/icons';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';
import clsx from '@proton/utils/clsx';

import { useBookings } from './bookingsProvider/BookingsProvider';
import { getBookingLocationOption } from './bookingsProvider/bookingsHelpers';
import { BookingLocation, BookingState } from './bookingsProvider/interface';

interface FormIconRowProps extends PropsWithChildren {
    title: string;
    hideBorder?: boolean;
    narrowSection?: boolean;
    icon: IconName;
}

const FormIconRow = ({ title, icon, children, hideBorder = false, narrowSection = false }: FormIconRowProps) => {
    return (
        <IconRow
            icon={icon}
            containerClassName={clsx('items-baseline', narrowSection && 'pr-11')}
            labelClassName="pt-0.5"
        >
            <h2 className="text-sm text-semibold mb-2">{title}</h2>
            {children}
            {!hideBorder && <hr className="mt-5 mb-1 bg-weak" />}
        </IconRow>
    );
};

interface FormLocationOptionProps {
    value: BookingLocation;
    text: string;
}

const FormLocationOptionContent = ({ value, text }: FormLocationOptionProps) => {
    let icon: ReactNode = null;
    switch (value) {
        case BookingLocation.MEET:
            icon = <MeetLogo variant="glyph-only" size={4} />;
            break;
        case BookingLocation.IN_PERSON:
            icon = <Icon name="map-pin" />;
            break;
    }

    return (
        <span className="flex items-center gap-2">
            {icon}
            {text}
        </span>
    );
};

export const Form = () => {
    const scheduleOptions = getCalendarEventDefaultDuration();
    const locationOptions = getBookingLocationOption();

    const [writeableCalendars = []] = useWriteableCalendars();

    const { formData, updateFormData } = useBookings();

    return (
        <form className="flex flex-column">
            <FormIconRow icon="text-title" title={c('Info').t`Name your booking page`}>
                <InputFieldTwo
                    id="booking-title"
                    as={TextArea}
                    placeholder={c('Placeholder').t`Booking page title`}
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    maxLength={MAX_CHARS_API.TITLE}
                    assistContainerClassName="hidden"
                    inputContainerClassName="text-xl text-semibold"
                    minRows={1}
                    rows={2}
                    unstyled
                    autoFocus
                />
            </FormIconRow>

            <FormIconRow icon="clock" title={c('Info').t`How long should an appointment last?`}>
                <div className="flex gap-1">
                    {scheduleOptions.map((option) => (
                        <Button
                            onClick={() => updateFormData('duration', option.value)}
                            shape={formData.duration === option.value ? 'solid' : 'outline'}
                            color="weak"
                            pill
                        >
                            {option.text}
                        </Button>
                    ))}
                </div>
            </FormIconRow>

            {/*<FormIconRow icon="calendar-list-check" title={c('Info').t`When are you free?`}>
                todo
            </FormIconRow>*/}

            <FormIconRow icon="map-pin" title={c('Info').t`Where will the appointment take place?`} narrowSection>
                <InputFieldTwo
                    as={SelectTwo}
                    id="calendar-select"
                    value={formData.location}
                    onChange={({ value }: { value: any }) => {
                        updateFormData('location', value);
                    }}
                    assistContainerClassName="hidden"
                    className="w-fit-content"
                >
                    {locationOptions.map((option) => (
                        <Option key={option.value} value={option.value} title={option.text}>
                            <FormLocationOptionContent value={option.value} text={option.text} />
                        </Option>
                    ))}
                </InputFieldTwo>
            </FormIconRow>

            <FormIconRow
                icon="calendar-grid"
                title={c('Info').t`In which calendar should bookings appear?`}
                narrowSection
            >
                <InputFieldTwo
                    as={SelectTwo}
                    id="calendar-select"
                    value={formData.selectedCalendar}
                    onChange={({ value }: { value: any }) => {
                        updateFormData('selectedCalendar', value);
                    }}
                    assistContainerClassName="hidden"
                    className="w-fit-content"
                >
                    {writeableCalendars.map((calendar) => (
                        <Option key={calendar.ID} value={calendar.ID} title={calendar.Name}>
                            <span
                                className="h-2 w-2 inline-block rounded-full mr-2"
                                style={{ backgroundColor: calendar.Color }}
                            />
                            <span>{calendar.Name}</span>
                        </Option>
                    ))}
                </InputFieldTwo>
            </FormIconRow>

            <FormIconRow icon="file-lines" title={c('Info').t`What should people know before booking?`} narrowSection>
                <TextArea
                    id="booking-description"
                    placeholder={c('Placeholder').t`Add a booking page description`}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={2}
                    maxLength={MAX_CHARS_API.EVENT_DESCRIPTION}
                />
            </FormIconRow>

            {/*<FormIconRow icon="shield" title={c('Info').t`Protect this page with a password?`} hideBorder>
                todo
            </FormIconRow>*/}

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
        <div className="flex justify-space-between gap-6">
            <Button disabled={loading} onClick={() => changeBookingState(BookingState.OFF)}>{c('Action')
                .t`Cancel`}</Button>
            <Button loading={loading} color="norm" type="submit" onClick={submitForm}>{c('Action')
                .t`Create booking page`}</Button>
        </div>
    );
};

export const BookingManagement = { Form, Buttons, Header };

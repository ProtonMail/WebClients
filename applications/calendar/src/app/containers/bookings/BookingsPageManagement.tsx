import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import { InputField } from '@proton/components/components/v2/field/InputField';
import PasswordInput from '@proton/components/components/v2/input/PasswordInput';
import TextArea from '@proton/components/components/v2/input/TextArea';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { Copy } from '@proton/components/index';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';

import { FormIconRow, FormLocationOptionContent } from './BookingsFormComponents';
import { getBookingLocationOption } from './bookingHelpers';
import { useBookings } from './bookingsProvider/BookingsProvider';
import { BookingLocation, BookingState } from './bookingsProvider/interface';

export const Form = () => {
    const scheduleOptions = getCalendarEventDefaultDuration({ includeShortDurations: true, shortLabels: true });
    const locationOptions = getBookingLocationOption();

    const [writeableCalendars = []] = useWriteableCalendars();

    const { state, toggle } = useToggle(false);
    const { createNotification } = useNotifications();

    const { formData, updateFormData } = useBookings();

    return (
        <form className="flex flex-column">
            <FormIconRow icon="text-title" title={c('Info').t`Name your booking page`}>
                <InputField
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

            <FormIconRow icon="map-pin" title={c('Info').t`Where will the appointment take place?`}>
                <InputField
                    as={SelectTwo}
                    id="location-select"
                    value={formData.locationType}
                    onChange={({ value }: { value: any }) => {
                        updateFormData('locationType', value);
                    }}
                    assistContainerClassName="hidden"
                    className="w-fit-content"
                >
                    {locationOptions.map((option) => (
                        <Option key={option.value} value={option.value} title={option.text}>
                            <FormLocationOptionContent value={option.value} text={option.text} />
                        </Option>
                    ))}
                </InputField>

                {formData.locationType === BookingLocation.IN_PERSON && (
                    <InputField
                        id="booking-location"
                        className="mt-2"
                        placeholder={c('Placeholder').t`Add location`}
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        maxLength={MAX_CHARS_API.LOCATION}
                        assistContainerClassName="hidden"
                        autoFocus
                    />
                )}
            </FormIconRow>

            <FormIconRow icon="calendar-grid" title={c('Info').t`In which calendar should bookings appear?`}>
                <InputField
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
                </InputField>
            </FormIconRow>

            <FormIconRow icon="file-lines" title={c('Info').t`What should people know before booking?`}>
                <TextArea
                    id="booking-description"
                    placeholder={c('Placeholder').t`Add a booking page description`}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={2}
                    maxLength={MAX_CHARS_API.EVENT_DESCRIPTION}
                />
            </FormIconRow>

            <FormIconRow
                icon="shield"
                title={c('Info').t`Enable password protection`}
                hideBorder
                suffix={<Toggle checked={state} onChange={() => toggle()} />}
            >
                {state ? (
                    <div className="mt-2 flex flex-nowrap gap-2">
                        <PasswordInput
                            id="booking-password"
                            placeholder={c('Placeholder').t`Add password`}
                            value={formData.password}
                            maxLength={MAX_CHARS_API.TITLE} // 255 chars max to avoid unlimited password length
                            onChange={(e) => updateFormData('password', e.target.value)}
                            autoFocus
                        />
                        <Copy
                            id="booking-password-copy"
                            value={formData.password || ''}
                            shape="ghost"
                            onCopy={() => {
                                createNotification({ text: c('Info').t`Password copied` });
                            }}
                        />
                    </div>
                ) : null}
            </FormIconRow>
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

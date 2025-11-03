import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import { Collapsible, CollapsibleContent, CollapsibleHeader, CollapsibleHeaderIconButton } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { InputField } from '@proton/components/components/v2/field/InputField';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';
import { dateLocale } from '@proton/shared/lib/i18n';

import { FormIconRow, FormLocationOptionContent } from './BookingsFormComponents';
import { getBookingLocationOption, validateFormData } from './bookingHelpers';
import { useBookings } from './bookingsProvider/BookingsProvider';
import type { Slot } from './bookingsProvider/interface';
import { BookingLocation, BookingState } from './bookingsProvider/interface';

// TODO remove this, only used for testing
const TmpBookingSlots = ({ slots }: { slots: Slot[] }) => {
    const slotsGroupedByDay = Object.groupBy(slots, (slot) => slot.start.toDateString());

    return (
        <Collapsible>
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                Total of {slots.length} slots
            </CollapsibleHeader>
            <CollapsibleContent>
                {Object.entries(slotsGroupedByDay).map(([date, slots]) => (
                    <div key={date}>
                        <p className="font-semibold mt-2 m-0">
                            {date}, contains {slots?.length} slots
                        </p>
                        {slots?.map((slot) => (
                            <p className="m-0 text-sm color-weak" key={slot.id}>
                                From {format(slot.start, 'hh:mm', { locale: dateLocale })}, to{' '}
                                {format(slot.end, 'hh:mm', { locale: dateLocale })}
                            </p>
                        ))}
                    </div>
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};

export const Form = () => {
    const scheduleOptions = getCalendarEventDefaultDuration({ includeShortDurations: true, shortLabels: true });
    const locationOptions = getBookingLocationOption();

    const [writeableCalendars = []] = useWriteableCalendars({ canBeDisabled: false, canBeShared: false });

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

            <FormIconRow icon="calendar-list-check" title={c('Info').t`When are you free?`}>
                <TmpBookingSlots slots={formData.bookingSlots} />
            </FormIconRow>

            <FormIconRow icon="map-pin" title={c('Info').t`Where will the appointment take place?`}>
                <InputField
                    as={SelectTwo}
                    id="location-select"
                    value={formData.locationType}
                    onChange={({ value }: { value: any }) => {
                        updateFormData('locationType', value);
                    }}
                    assistContainerClassName="hidden"
                    fullWidth={false}
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
                    className="max-w-full"
                    fullWidth={false}
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
    const { changeBookingState, submitForm, formData, loading } = useBookings();

    const validation = validateFormData(formData);
    const isError = validation && validation.type === 'error';

    return (
        <>
            {isError ? <p className="color-danger text-sm text-right m-0 mb-2">{validation.message}</p> : null}
            <div className="flex justify-space-between gap-6">
                <Button disabled={loading} onClick={() => changeBookingState(BookingState.OFF)}>{c('Action')
                    .t`Cancel`}</Button>
                <Button disabled={!!validation} loading={loading} color="norm" type="submit" onClick={submitForm}>{c(
                    'Action'
                ).t`Create booking page`}</Button>
            </div>
        </>
    );
};

export const BookingManagement = { Form, Buttons, Header };

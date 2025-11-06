import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import { DropdownSizeUnit } from '@proton/components';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { InputField } from '@proton/components/components/v2/field/InputField';
import TextArea from '@proton/components/components/v2/input/TextArea';
import {
    IcCalendarGrid,
    IcCalendarListCheck,
    IcClock,
    IcCrossBig,
    IcFileLines,
    IcMapPin,
    IcTextTitle,
} from '@proton/icons';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';

import { useBookings } from '../bookingsProvider/BookingsProvider';
import { BookingLocation, BookingState } from '../bookingsProvider/interface';
import { getBookingLocationOption, validateFormData } from '../utils/bookingHelpers';
import { FormIconRow, FormLocationOptionContent } from './BookingsFormComponents';
import { FormRangeList } from './FormRangeList';

export const Form = () => {
    const scheduleOptions = getCalendarEventDefaultDuration({ includeShortDurations: true, shortLabels: true });
    const locationOptions = getBookingLocationOption();

    const [writeableCalendars = []] = useWriteableCalendars({ canBeDisabled: false, canBeShared: false });

    const { formData, updateFormData } = useBookings();

    return (
        <form className="flex flex-column">
            <FormIconRow icon={<IcTextTitle />} title={c('Info').t`Name your booking page`}>
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

            <FormIconRow icon={<IcClock />} title={c('Info').t`How long should an appointment last?`}>
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

            <FormIconRow icon={<IcCalendarListCheck />} title={c('Info').t`When are you free?`}>
                <FormRangeList />
            </FormIconRow>

            <FormIconRow icon={<IcMapPin />} title={c('Info').t`Where will the appointment take place?`}>
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

            <FormIconRow icon={<IcCalendarGrid />} title={c('Info').t`In which calendar should bookings appear?`}>
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
                    size={{ width: DropdownSizeUnit.Static }}
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
            </FormIconRow>

            <FormIconRow icon={<IcFileLines />} title={c('Info').t`What should people know before booking?`}>
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
            <IcCrossBig />
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

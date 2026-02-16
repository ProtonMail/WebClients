import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Checkbox from '@proton/components/components/input/Checkbox';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { InputField } from '@proton/components/components/v2/field/InputField';
import TextArea from '@proton/components/components/v2/input/TextArea';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import { IcCalendarDay } from '@proton/icons/icons/IcCalendarDay';
import { IcCalendarLock } from '@proton/icons/icons/IcCalendarLock';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';
import { IcTextTitle } from '@proton/icons/icons/IcTextTitle';
import { Product } from '@proton/shared/lib/ProductEnum';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { useBookings } from '../bookingsProvider/BookingsProvider';
import { BookingLocation, BookingState, MinimumNoticeMode } from '../interface';
import { validateFormData } from '../utils/form/formHelpers';
import { BookingFormCalendarField } from './BookingFormCalendarField';
import { FormErrorWrapper, FormIconRow, FormLocationOptionContent } from './BookingsFormComponents';
import { FormRangeList } from './FormRangeList';

import './BookingForms.scss';

export const getBookingLocationOption = (isMeetEnabled: boolean) => {
    return [
        isMeetEnabled && { text: MEET_APP_NAME, value: BookingLocation.MEET },
        { text: c('Info').t`Other location`, value: BookingLocation.OTHER_LOCATION },
    ].filter(isTruthy);
};

const getBookingBufferTimeOptions = () => {
    return [
        { value: MinimumNoticeMode.TWO_HOURS, label: c('Info').t`Min. 2 hours before` },
        { value: MinimumNoticeMode.FORTY_EIGHT_HOURS, label: c('Info').t`Min. 48 hours before` },
        { value: MinimumNoticeMode.NOT_SAME_DAY, label: c('Info').t`Not on the same day` },
    ];
};

export const Form = () => {
    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');
    const isNoticeModeEnabled = useFlag('CalendarBookingsNoticeMode');
    const [allowedProducts] = useAllowedProducts();

    const canUseMeetLocation = isMeetVideoConferenceEnabled && allowedProducts.has(Product.Meet);

    const scheduleOptions = getCalendarEventDefaultDuration({ shortLabels: true });
    const locationOptions = getBookingLocationOption(canUseMeetLocation);

    const { formData, updateFormData } = useBookings();

    const handleToggleBufferTime = (checked: boolean) => {
        if (checked) {
            updateFormData('minimumNoticeMode', MinimumNoticeMode.TWO_HOURS);
        } else {
            updateFormData('minimumNoticeMode', undefined);
        }
    };

    const handleSelectBufferTime = (value: MinimumNoticeMode) => {
        updateFormData('minimumNoticeMode', value);
    };

    return (
        <form className="flex flex-column flex-nowrap">
            <FormIconRow icon={<IcTextTitle />} title={c('Info').t`What do you want to call this booking page?`}>
                <label htmlFor="booking-title" className="sr-only">{c('Info')
                    .t`What do you want to call this booking page?`}</label>
                <InputField
                    id="booking-title"
                    aria-describedby="booking-title"
                    as={TextArea}
                    placeholder={c('Placeholder').t`Add title`}
                    value={formData.summary}
                    onChange={(e) => updateFormData('summary', e.target.value)}
                    maxLength={MAX_CHARS_API.TITLE}
                    assistContainerClassName="hidden"
                    inputContainerClassName="text-xl text-semibold"
                    className="resize-none"
                    minRows={1}
                    rows={3}
                    autoGrow
                    autoFocus
                />
            </FormIconRow>

            <FormIconRow icon={<IcClock />} title={c('Info').t`How long should an appointment last?`}>
                <label htmlFor="duration-select" className="sr-only">{c('label')
                    .t`How long should an appointment last?`}</label>
                <div className="flex gap-1">
                    {scheduleOptions.map((option) => (
                        <Button
                            key={option.value}
                            onClick={() => updateFormData('duration', option.value)}
                            shape="outline"
                            color={formData.duration === option.value ? 'norm' : 'weak'}
                            aria-pressed={formData.duration === option.value}
                            aria-describedby="duration-select"
                            className={clsx(
                                'booking-sidebar-duration-button',
                                formData.duration === option.value && 'text-semibold'
                            )}
                            pill
                        >
                            {option.text}
                        </Button>
                    ))}
                </div>
            </FormIconRow>

            <FormIconRow icon={<IcCalendarDay />} title={c('Info').t`When can appointments be booked?`}>
                <FormRangeList />
            </FormIconRow>

            {isNoticeModeEnabled && (
                <FormIconRow icon={<IcCalendarLock />} title={c('Info').t`How far in advance can someone book?`}>
                    <Checkbox
                        className="gap-0 mb-4 text-sm items-center"
                        checked={!!formData.minimumNoticeMode}
                        onChange={({ target }) => handleToggleBufferTime(target.checked)}
                    >
                        <span className="mt-0.5 ml-2">{c('Label').t`Add notice period`}</span>
                    </Checkbox>
                    {!!formData.minimumNoticeMode && (
                        <div className="flex flex-column flex-nowrap gap-3 ml-8 pl-1">
                            <RadioGroup
                                name="selected-buffer-time"
                                className="text-sm inline-flex items-center flex-nowrap"
                                onChange={handleSelectBufferTime}
                                value={formData.minimumNoticeMode}
                                options={getBookingBufferTimeOptions()}
                            />
                        </div>
                    )}
                </FormIconRow>
            )}

            <FormIconRow icon={<IcMapPin />} title={c('Info').t`Where will the appointment take place?`}>
                {locationOptions.length > 1 && (
                    <InputField
                        as={SelectTwo}
                        id="location-select"
                        value={formData.locationType}
                        label={c('Info').t`Where will the appointment take place?`}
                        labelContainerClassName="sr-only"
                        onChange={({ value }: { value: any }) => {
                            updateFormData('locationType', value);
                        }}
                        assistContainerClassName="hidden"
                        fullWidth={false}
                        dropdownClassName="w-fit-content"
                    >
                        {locationOptions.map((option) => (
                            <Option key={option.value} value={option.value} title={option.text}>
                                <FormLocationOptionContent value={option.value} text={option.text} />
                            </Option>
                        ))}
                    </InputField>
                )}

                {formData.locationType === BookingLocation.OTHER_LOCATION && (
                    <InputField
                        id="booking-location"
                        className="mt-2"
                        label={c('Label').t`Location`}
                        labelContainerClassName="sr-only"
                        placeholder={c('Placeholder').t`Add location`}
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        maxLength={MAX_CHARS_API.LOCATION}
                        error={formData.location?.trim().length === 0 ? c('Error').t`Location is required` : undefined}
                        autoFocus
                    />
                )}
            </FormIconRow>

            <BookingFormCalendarField />

            <FormIconRow icon={<IcFileLines />} title={c('label').t`What should people know about this appointment?`}>
                <label htmlFor="booking-description" className="sr-only">{c('label')
                    .t`What should people know about this appointment?`}</label>
                <TextArea
                    id="booking-description"
                    placeholder={c('Placeholder').t`Enter a short description or additional info`}
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
    const { closeBookingSidebar } = useBookings();

    return (
        <Tooltip title={c('Action').t`Close sidebar`}>
            <Button icon shape="ghost" className="rounded-full shadow-norm" onClick={() => closeBookingSidebar()}>
                <IcCrossBig alt={c('Action').t`Close sidebar`} />
            </Button>
        </Tooltip>
    );
};

const Buttons = () => {
    const { closeBookingSidebar, submitForm, formData, loading, bookingsState } = useBookings();

    const validation = validateFormData(formData);
    const isError = validation && validation.type === 'error';

    return (
        <>
            {isError ? (
                <FormErrorWrapper wrapperClassName="justify-end mb-3">{validation.message}</FormErrorWrapper>
            ) : null}
            <div className="flex flex-column-reverse sm:flex-row justify-space-between gap-2">
                <Button disabled={loading} onClick={() => closeBookingSidebar()}>{c('Action').t`Cancel`}</Button>
                <Button disabled={!!validation} loading={loading} color="norm" type="submit" onClick={submitForm}>
                    {bookingsState === BookingState.EDIT_EXISTING
                        ? c('Action').t`Save`
                        : c('Action').t`Create booking page`}
                </Button>
            </div>
        </>
    );
};

export const BookingManagement = { Form, Buttons, Header };

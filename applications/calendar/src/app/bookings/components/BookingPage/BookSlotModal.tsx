import { useState } from 'react';

import { addMinutes } from 'date-fns';
import format from 'date-fns/format';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Form,
    InputFieldTwo,
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFormErrors,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getTimezoneAndOffset } from '@proton/shared/lib/date/timezone';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { dateLocale } from '@proton/shared/lib/i18n';

import { type BookingTimeslot, useBookingStore } from '../../booking.store';
import { useExternalBookingActions } from '../../useExternalBookingActions';

interface BookingSlotModalProps extends ModalProps {
    timeslot: BookingTimeslot;
}

const NAME_MAX_LENGTH = 100;

export const BookSlotModal = ({ timeslot, ...rest }: BookingSlotModalProps) => {
    const { submitBooking, bookingDetails } = useExternalBookingActions();
    const selectedTimezone = useBookingStore((state) => state.selectedTimezone);

    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isLoading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const organizerEmailValidator = (email: string) => {
        const isOrganizerEmail =
            canonicalizeInternalEmail(email) === canonicalizeInternalEmail(bookingDetails?.inviterEmail || '');

        return isOrganizerEmail ? c('Error').t`You cannot enter the organizer email` : '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onFormSubmit()) {
            return;
        }

        await submitBooking(timeslot, { name, email });
        rest.onClose?.();
    };

    // To check later: if case where start/end time is not on the same day
    const subtitle = (
        <>
            <div className="booking-color-title text-xl booking-color-title ">
                {format(timeslot.tzDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}
                <span aria-hidden="true" className="pointer-events-none mx-2">
                    •
                </span>
                {format(timeslot.tzDate, 'HH:mm', { locale: dateLocale })}
                {' - '}
                {format(addMinutes(timeslot.tzDate, bookingDetails?.duration || 0), 'HH:mm', { locale: dateLocale })}
            </div>
            <div className="color-weak">{getTimezoneAndOffset(selectedTimezone, timeslot.tzDate)}</div>
        </>
    );

    return (
        <ModalTwo as={Form} onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e))} {...rest}>
            <ModalTwoHeader
                title={c('Form').t`Confirm your booking`}
                titleClassName="text-4xl text-normal booking-color-title font-arizona"
                subline={subtitle}
                sublineClassName="mt-2"
                hasClose
                closeButtonProps={{
                    className: 'm-1',
                }}
            />
            <ModalTwoContent>
                <div className="mt-6">
                    <InputFieldTwo
                        autoFocus
                        label={c('Label').t`Full name`}
                        placeholder={c('Placeholder').t`Name of attendee`}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={NAME_MAX_LENGTH}
                        error={validator([requiredValidator(name)])}
                    />
                    <InputFieldTwo
                        label={c('Label').t`Email address`}
                        placeholder={c('Placeholder').t`Email for booking confirmation`}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={validator([
                            requiredValidator(email),
                            emailValidator(email),
                            organizerEmailValidator(email),
                        ])}
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} pill>{c('Action').t`Cancel`}</Button>
                <Button disabled={!name.trim() || !email.trim()} loading={isLoading} pill color="norm" type="submit">
                    {c('Action').t`Confirm booking`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

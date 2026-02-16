import { useEffect, useState } from 'react';

import { addMinutes } from 'date-fns';
import format from 'date-fns/format';
import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { getTimezoneAndOffset } from '@proton/shared/lib/date/timezone';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { dateLocale } from '@proton/shared/lib/i18n';

import { type BookingTimeslot, useBookingStore } from '../../booking.store';
import { useBookingsProvider } from '../../entryPoints/BookingsExternalProvider';
import { useExternalBookingActions } from '../../useExternalBookingActions';

interface BookingSlotModalProps extends ModalProps {
    timeslot: BookingTimeslot;
}

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 320;

export const BookSlotModal = ({ timeslot, ...rest }: BookingSlotModalProps) => {
    const { submitBooking, bookingDetails } = useExternalBookingActions();
    const selectedTimezone = useBookingStore((state) => state.selectedTimezone);

    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [hasInitialized, setHasInitialized] = useState(false);

    const [isLoading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const { isGuest } = useBookingsProvider();
    const getAddresses = useGetAddresses();

    useEffect(() => {
        if (isGuest || hasInitialized) {
            return;
        }

        const fetchAddresses = async () => {
            const addresses = await getAddresses();
            const firstAddress = addresses?.[0]?.Email;
            if (firstAddress) {
                setEmail(firstAddress);
            }

            setHasInitialized(true);
        };

        void fetchAddresses();
    }, [isGuest, getAddresses, hasInitialized]);

    const organizerEmailValidator = (email: string) => {
        const isOrganizerEmail =
            canonicalizeInternalEmail(email) === canonicalizeInternalEmail(bookingDetails?.inviterEmail || '');

        return isOrganizerEmail ? c('Error').t`You cannot enter the organizer's email` : '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onFormSubmit()) {
            return;
        }

        const result = await submitBooking(timeslot, { name, email });

        if (result === 'success') {
            rest.onClose?.();
        }
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
        <ModalTwo
            as={Form}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e))}
            {...rest}
            className="booking-modal-slot p-5"
        >
            <ModalTwoHeader
                title={c('Form').t`Confirm your booking`}
                titleClassName="text-4xl text-normal booking-color-title font-arizona booking-modal-slot-title"
                subline={subtitle}
                sublineClassName="mt-2"
                hasClose={false}
            />
            <ModalTwoContent>
                <div className="mt-8 pt-4">
                    <InputFieldTwo
                        autoFocus
                        label={c('Label').t`Full name`}
                        placeholder={c('Placeholder').t`Name of attendee`}
                        type="text"
                        bigger
                        value={name}
                        className="rounded-lg booking-modal-slot-input"
                        onChange={(e) => setName(e.target.value)}
                        maxLength={NAME_MAX_LENGTH}
                        error={validator([requiredValidator(name)])}
                    />
                    <InputFieldTwo
                        label={c('Label').t`Email address`}
                        placeholder={c('Placeholder').t`Email for booking confirmation`}
                        type="email"
                        bigger
                        value={email}
                        className="rounded-lg booking-modal-slot-input"
                        maxLength={EMAIL_MAX_LENGTH}
                        onChange={(e) => setEmail(e.target.value)}
                        error={validator([
                            requiredValidator(email),
                            emailValidator(email),
                            organizerEmailValidator(email),
                        ])}
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="sm:flex *:min-size-auto flex-column sm:flex-row sm:gap-5">
                <div className="flex-1">
                    <Button size="large" fullWidth className="text-semibold" onClick={rest.onClose} pill>{c('Action')
                        .t`Cancel`}</Button>
                </div>
                <div className="flex-1 booking-button-confirm-booking-container">
                    <Button
                        size="large"
                        className="text-semibold text-pre flex-1 booking-button-confirm-booking"
                        disabled={!name.trim() || !email.trim()}
                        loading={isLoading}
                        pill
                        color="norm"
                        type="submit"
                        fullWidth
                    >
                        <span className="relative booking-button-confirm-booking-inner">{c('Action')
                            .t`Confirm booking`}</span>
                    </Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

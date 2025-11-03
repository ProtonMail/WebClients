import { useState } from 'react';

import { fromUnixTime } from 'date-fns';
import format from 'date-fns/format';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    InputFieldTwo,
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFormErrors,
    useModalTwoStatic,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getTimezoneAndOffset } from '@proton/shared/lib/date/timezone';
import { emailValidator, maxLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { dateLocale } from '@proton/shared/lib/i18n';

import type { BookingDetails, BookingTimeslot } from '../booking.store';

interface BookingSlotModalProps {
    bookingDetails: BookingDetails;
    timeslot: BookingTimeslot;
    onConfirm: (name: string, email: string) => Promise<void>;
}

const BookingSlotModal = ({
    bookingDetails,
    timeslot,
    onConfirm,
    onClose,
    open,
    onExit,
}: BookingSlotModalProps & ModalProps) => {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isLoading, withLoading] = useLoading();
    const startDate = fromUnixTime(timeslot.startTime);
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onFormSubmit()) {
            return;
        }
        await onConfirm(name, email);
        onClose?.();
    };
    return (
        <ModalTwo
            as={Form}
            open={open}
            onExit={onExit}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e))}
        >
            <ModalTwoHeader
                hasClose
                closeButtonProps={{
                    className: 'm-1',
                }}
            />
            <ModalTwoContent>
                <div className="flex mb-6">
                    <div className="flex flex-column items-center mr-3">
                        <span className="h1 lh100">{startDate.getDate()}</span>
                        <span className="color-weak text-uppercase">
                            {format(startDate, 'MMM', { locale: dateLocale })}
                        </span>
                    </div>
                    <div className="flex flex-column">
                        <h1 className="text-xl text-semibold">{bookingDetails.summary}</h1>
                        <span className="color-weak mb-2">
                            {format(fromUnixTime(timeslot.startTime), 'EEEE HH:mm', { locale: dateLocale })}
                            {' - '}
                            {format(fromUnixTime(timeslot.endTime), 'HH:mm', { locale: dateLocale })}
                        </span>
                        <span className="color-weak">{getTimezoneAndOffset(timeslot.timezone)}</span>
                    </div>
                </div>
                <h3 className="text-rg text-semibold mb-2">{c('Form').t`Your contact info`}</h3>
                <InputFieldTwo
                    autoFocus
                    label={c('Label').t`Name`}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    // TODO: Check if we want specific name max length
                    error={validator([requiredValidator(name), maxLengthValidator(name, 100)])}
                />
                <InputFieldTwo
                    label={c('Label').t`Email`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={validator([requiredValidator(email), emailValidator(email)])}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button loading={isLoading} color="norm" type="submit">
                    {c('Action').t`Confirm booking`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useBookingSlotModal = () => {
    return useModalTwoStatic<BookingSlotModalProps & ModalProps>(BookingSlotModal);
};

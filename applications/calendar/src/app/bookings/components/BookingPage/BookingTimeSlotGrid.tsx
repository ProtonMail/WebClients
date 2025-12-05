import { useEffect, useState } from 'react';

import { format, isToday } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Loader } from '@proton/components';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { type BookingTimeslot, useBookingStore } from '../../booking.store';
import { AvailabilityState, useBookingNextAvailableSlot } from '../../useBookingNextAvailableSlot';
import { getDaysRange, getDaysSlotRange, getGridCount } from '../bookingViewHelpers';
import { BookSlotModal } from './BookSlotModal';
import { BookingEmptyRangeCard } from './BookingEmptyRangeCard';
import { BookingHeader } from './BookingHeader';

export const BookingTimeSlotGrid = () => {
    const [range, setRange] = useState<Date[]>([]);
    const [timeslot, setTimeslot] = useState<BookingTimeslot>();
    const [slotsArray, setSlotsArray] = useState<BookingTimeslot[][] | undefined[][]>([]);

    const isLoading = useBookingStore((state) => state.isLoading);
    const filterBookingSlotPerDay = useBookingStore((state) => state.filterBookingSlotPerDay);
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const selectedTimezone = useBookingStore((state) => state.selectedTimezone);

    const { availabilityState, handleNavigateToNextAvailableSlot } = useBookingNextAvailableSlot();

    const { activeBreakpoint } = useActiveBreakpoint();
    const gridSize = getGridCount(activeBreakpoint);
    const canShowSlots = slotsArray.length > 0 && !isLoading;

    const [bookSlotModalProps, setBookSlotModalOpen, renderBookModal] = useModalState();

    useEffect(() => {
        if (!bookingDetails || isLoading) {
            return;
        }

        const tmpRange = getDaysRange(gridSize, selectedDate);
        const rangeBooking = getDaysSlotRange(gridSize, bookingDetails, filterBookingSlotPerDay, selectedDate);

        setRange(tmpRange);
        setSlotsArray(rangeBooking);
    }, [gridSize, bookingDetails, selectedDate, filterBookingSlotPerDay, selectedTimezone, isLoading]);

    return (
        <main className="flex-1 w-full" aria-labelledby="booking-main-header-title">
            <BookingHeader gridSize={gridSize} availabilityState={availabilityState} />

            <div className="flex flex-row flex-nowrap gap-2 w-full">
                {range.map((date, i) => {
                    const dateHeaderShortString = format(date, 'EEE', { locale: dateLocale });
                    const dateHeaderLongString = format(date, 'EEEE d MMMM yyyy', { locale: dateLocale });
                    const dateNumberString = format(date, 'd', { locale: dateLocale });

                    return (
                        <div className="flex-1" key={date.getTime()}>
                            <h3 className="flex flex-column flex-nowrap items-center text-rg mb-2">
                                <div className="sr-only">{dateHeaderLongString}</div>
                                <div className="text-sm booking-color-title" aria-hidden="true">
                                    {dateHeaderShortString}
                                </div>
                                <div
                                    className={clsx(
                                        'flex items-center justify-center m-0 text-lg text-semibold ratio-square rounded-full booking-heading-number',
                                        isToday(date) && 'bg-primary'
                                    )}
                                    aria-hidden="true"
                                >
                                    <span className={clsx('lh100', !isToday(date) && 'booking-color-title')}>
                                        {dateNumberString}
                                    </span>
                                </div>
                            </h3>
                            <ul className="unstyled m-0 p-0 flex flex-column gap-2">
                                {canShowSlots &&
                                    slotsArray[i].map((timeslot, j) => {
                                        if (timeslot) {
                                            const timeString = format(timeslot.tzDate, 'HH:mm', {
                                                locale: dateLocale,
                                            });

                                            return (
                                                <li key={timeslot.id}>
                                                    <Button
                                                        shape="outline"
                                                        color="weak"
                                                        className="w-full booking-button-slot-outline"
                                                        onClick={() => {
                                                            setTimeslot(timeslot);
                                                            setBookSlotModalOpen(true);
                                                        }}
                                                        title={
                                                            // if we don't want this title, we can use aria-label instead, it will be more explicit for blind users
                                                            // translator: Full sentence would be: "Select <Tuesday, 12th November 2025> at <10:00>"
                                                            c('Action')
                                                                .t`Select ${dateHeaderLongString} at ${timeString}`
                                                        }
                                                    >
                                                        {timeString}
                                                    </Button>
                                                </li>
                                            );
                                        }

                                        return (
                                            <li aria-hidden="true" key={`${i}-${j}`}>
                                                <Button
                                                    disabled
                                                    shape="outline"
                                                    color="norm"
                                                    className="w-full booking-button-slot-outline"
                                                >
                                                    –
                                                </Button>
                                            </li>
                                        );
                                    })}
                            </ul>
                        </div>
                    );
                })}
            </div>
            {!canShowSlots && (
                <>
                    {(availabilityState === AvailabilityState.Loading || isLoading) && (
                        <BookingEmptyRangeCard
                            message={
                                <div className="flex justify-center items-center gap-2">
                                    <Loader />
                                    {c('Info').t`Loading appointments...`}
                                </div>
                            }
                        />
                    )}
                    {availabilityState === AvailabilityState.HasNextSlot && (
                        <BookingEmptyRangeCard
                            message={c('Info').t`No appointments available this week`}
                            action={
                                <Button shape="underline" color="norm" onClick={handleNavigateToNextAvailableSlot}>{c(
                                    'Action'
                                ).t`Go to the next available appointment`}</Button>
                            }
                        />
                    )}
                    {availabilityState === AvailabilityState.ShouldNavigateToFirst && (
                        <BookingEmptyRangeCard
                            message={c('Info').t`No future appointments available`}
                            action={
                                <Button shape="underline" color="norm" onClick={handleNavigateToNextAvailableSlot}>{c(
                                    'Action'
                                ).t`Go to the first available appointment`}</Button>
                            }
                        />
                    )}
                    {availabilityState === AvailabilityState.NoSlotAvailable && (
                        <BookingEmptyRangeCard message={c('Info').t`No appointments available`} />
                    )}
                </>
            )}
            {renderBookModal && timeslot && <BookSlotModal timeslot={timeslot} {...bookSlotModalProps} />}
        </main>
    );
};

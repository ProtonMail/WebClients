import type { BookingFormData, BookingRange, Slot } from '../bookingsProvider/interface';

const hasBookingSlotsChanged = (currentSlots: Slot[], initialSlots?: Slot[]): boolean => {
    if (!initialSlots) {
        return currentSlots.length > 0;
    }

    if (currentSlots.length !== initialSlots.length) {
        return true;
    }

    const currentSlotIds = new Set(currentSlots.map((slot) => slot.id));
    const initialSlotIds = new Set(initialSlots.map((slot) => slot.id));

    if (currentSlotIds.size !== initialSlotIds.size) {
        return true;
    }

    return false;
};

const hasBookingRangesChanged = (currentRanges: BookingRange[] | null, initialRanges?: BookingRange[]): boolean => {
    if (!initialRanges) {
        return (currentRanges?.length ?? 0) > 0;
    }

    if ((currentRanges?.length ?? 0) !== initialRanges.length) {
        return true;
    }

    if (!currentRanges) {
        return false;
    }

    const currentRangeIds = new Set(currentRanges.map((range) => range.id));
    const initialRangeIds = new Set(initialRanges.map((range) => range.id));

    if (currentRangeIds.size !== initialRangeIds.size) {
        return true;
    }

    return false;
};

export const hasBookingFormChanged = ({
    currentFormData,
    currentBookingRanges,
    initialFormData,
    initialBookingRanges,
}: {
    currentFormData: BookingFormData;
    currentBookingRanges: BookingRange[] | null;
    initialFormData: BookingFormData | undefined;
    initialBookingRanges: BookingRange[] | undefined;
}): boolean => {
    if (!initialFormData) {
        return false;
    }

    if (
        currentFormData.summary !== initialFormData.summary ||
        currentFormData.description !== initialFormData.description ||
        currentFormData.duration !== initialFormData.duration ||
        currentFormData.selectedCalendar !== initialFormData.selectedCalendar ||
        currentFormData.location !== initialFormData.location ||
        currentFormData.locationType !== initialFormData.locationType
    ) {
        return true;
    }

    if (hasBookingSlotsChanged(currentFormData.bookingSlots, initialFormData.bookingSlots)) {
        return true;
    }

    if (hasBookingRangesChanged(currentBookingRanges, initialBookingRanges)) {
        return true;
    }

    return false;
};

import useFlag from '@proton/unleash/useFlag';

export const useBookingsAvailability = () => {
    const isBookingsEnabled = useFlag('CalendarBookings');
    return isBookingsEnabled;
};

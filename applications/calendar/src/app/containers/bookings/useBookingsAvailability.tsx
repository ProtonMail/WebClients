import { useFlag } from '@proton/unleash/useFlag';

export const useBookingsAvailability = () => {
    const calendarBookingsDisabled = useFlag('CalendarBookingsDisabled');
    return !calendarBookingsDisabled;
};

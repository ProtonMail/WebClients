import useFlag from '@proton/unleash/useFlag';

export const useSchedulingAvailability = () => {
    const isSchedulingEnabled = useFlag('CalendarScheduling');
    return isSchedulingEnabled;
};

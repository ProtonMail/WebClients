import { act, renderHook } from '@testing-library/react-hooks';
import { addDays, addHours, format, isSameDay, isSameHour, set, startOfTomorrow, startOfYesterday } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

import { getMinScheduleTime } from '../../helpers/schedule';
import useFutureTimeDate from './useFutureTimeDate';

describe('useFutureTimeDate', () => {
    it('should return no errors and the new date if date is changed to tomorrow', () => {
        const tomorrow = startOfTomorrow();
        const { result } = renderHook(() => useFutureTimeDate({ defaultDate: new Date() }));
        act(() => {
            result.current.handleChangeDate(tomorrow);
        });

        expect(result.current.errorDate).toBeUndefined();
        expect(result.current.date).toEqual(tomorrow);
    });

    it('should not change anything if no date is passed to handleChangeDate', () => {
        const date = new Date();
        const { result } = renderHook(() => useFutureTimeDate({ defaultDate: date }));
        act(() => {
            result.current.handleChangeDate();
        });

        expect(result.current.errorDate).toBeUndefined();
        expect(result.current.date).toEqual(date);
    });

    it('should return an error if date is changed to yesterday', () => {
        const yesterday = startOfYesterday();
        const { result } = renderHook(() => useFutureTimeDate({ defaultDate: new Date() }));
        act(() => {
            result.current.handleChangeDate(yesterday);
        });

        expect(result.current.errorDate).toBe('Choose a date in the future.');
    });

    it('should return custom error if date is larger than max day', () => {
        const future = addDays(new Date(), 20);
        const { result } = renderHook(() =>
            useFutureTimeDate({ defaultDate: new Date(), maxDaysAllowed: 10, maxDateErrorMessage: 'Custom error' })
        );
        act(() => {
            result.current.handleChangeDate(future);
        });

        expect(isSameDay(addDays(new Date(), 10), result.current.maxDate ?? startOfTomorrow())).toBe(true);
        expect(result.current.errorDate).toBe('Custom error');
    });

    it('should return next available slot when changing date to today with time before now', () => {
        const today = new Date();
        const before = set(today, { hours: today.getHours() - 2 });
        // Set the time to the start of the hour to avoid issue if we're more than 30 minutes into the hour
        const defaultDate = set(today, { minutes: 0, seconds: 0, milliseconds: 0 });
        const { result } = renderHook(() => useFutureTimeDate({ defaultDate }));
        act(() => {
            result.current.handleChangeDate(before);
        });

        const nextAvailableTime = getMinScheduleTime(before);
        // make sure the test fails if nextAvailableTime is undefined by comparing it to yesterday
        expect(isSameDay(result.current.date, nextAvailableTime ?? startOfYesterday())).toBe(true);
        expect(isSameHour(result.current.date, nextAvailableTime ?? startOfYesterday())).toBe(true);
    });

    it('should return no errors and the new time if time is changed to the future', () => {
        const inTwoHours = addHours(new Date(), 2);
        const { result } = renderHook(() => useFutureTimeDate({ defaultDate: new Date() }));
        act(() => {
            result.current.handleChangeTime(inTwoHours);
        });

        expect(result.current.errorTime).toBeUndefined();
        expect(result.current.time).toEqual(inTwoHours);
    });

    it('should return today if date is set to today', () => {
        const { result } = renderHook(() => useFutureTimeDate({ defaultDate: new Date() }));

        const today = new Date();
        let res = result.current.formatDateInput(today, { code: 'en-US' });
        expect(res).toEqual('Today');

        const tomorrow = startOfTomorrow();
        res = result.current.formatDateInput(tomorrow, { code: 'en-US' });
        expect(res).toEqual('Tomorrow');

        const inTwoDays = addDays(new Date(), 2);
        const formatted = format(inTwoDays, 'PP', { locale: dateLocale });
        res = result.current.formatDateInput(inTwoDays, dateLocale);
        expect(res).toEqual(formatted);
    });

    it('should update date and time', () => {
        const randomDateInFuture = set(new Date(), {
            year: 2100,
            month: 10,
            date: 10,
            hours: 10,
            minutes: 10,
            seconds: 10,
        });
        const { result } = renderHook(() => useFutureTimeDate({ defaultDate: new Date() }));
        act(() => {
            result.current.updateDateAndTime(randomDateInFuture);
        });

        expect(result.current.date).toEqual(randomDateInFuture);
        expect(result.current.time).toEqual(randomDateInFuture);
    });
});

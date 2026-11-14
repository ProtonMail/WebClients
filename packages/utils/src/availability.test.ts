import { type Mock, vi } from 'vitest';

import { Availability, AvailabilityTypes } from './availability';

const FIVE_MINUTES_IN_MILLISECONDS = 5 * 60 * 1000;

vi.useFakeTimers();
vi.spyOn(global, 'setInterval');
vi.spyOn(global, 'clearInterval');

describe('Availability', () => {
    let reportMock: Mock;

    beforeEach(() => {
        reportMock = vi.fn();
        Availability.clear();
        vi.clearAllMocks();
    });

    it('should initialize with the correct interval', () => {
        Availability.init(reportMock);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), FIVE_MINUTES_IN_MILLISECONDS);
    });

    it('should call report with false when no error has occurred', () => {
        Availability.init(reportMock);
        vi.advanceTimersByTime(FIVE_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: false, ERROR: false, SENTRY: false });
    });

    it('should call report with sentry:true when a sentry error has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        vi.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.SENTRY);
        vi.spyOn(Date, 'now').mockReturnValue(FIVE_MINUTES_IN_MILLISECONDS + 2);
        vi.advanceTimersByTime(FIVE_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: false, ERROR: false, SENTRY: true });
    });

    it('should call report with critical:true when a critical error has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        vi.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.CRITICAL);
        vi.spyOn(Date, 'now').mockReturnValue(FIVE_MINUTES_IN_MILLISECONDS + 2);
        vi.advanceTimersByTime(FIVE_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: true, ERROR: false, SENTRY: false });
    });

    it('should call report with error:true when an error has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        vi.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.ERROR);
        vi.spyOn(Date, 'now').mockReturnValue(FIVE_MINUTES_IN_MILLISECONDS + 2);
        vi.advanceTimersByTime(FIVE_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: false, ERROR: true, SENTRY: false });
    });

    it('should call report with every keys to true when an all kind of errors has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        vi.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.ERROR);
        Availability.mark(AvailabilityTypes.SENTRY);
        Availability.mark(AvailabilityTypes.CRITICAL);
        vi.spyOn(Date, 'now').mockReturnValue(FIVE_MINUTES_IN_MILLISECONDS + 2);
        vi.advanceTimersByTime(FIVE_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: true, ERROR: true, SENTRY: true });
    });

    it('should call report with false when an error has occurred but 5 minutes have not passed', () => {
        Availability.init(reportMock);
        vi.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.SENTRY);
        vi.spyOn(Date, 'now').mockReturnValue(FIVE_MINUTES_IN_MILLISECONDS - 2);
        vi.advanceTimersByTime(FIVE_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: false, ERROR: false, SENTRY: false });
    });

    it('should clear the interval on init', () => {
        Availability.init(reportMock);
        expect(clearInterval).toHaveBeenCalledTimes(1);
    });

    it('should clear the interval on clear', () => {
        Availability.init(reportMock);
        Availability.clear();
        expect(clearInterval).toHaveBeenCalledTimes(2);
    });
});

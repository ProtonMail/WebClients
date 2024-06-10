import { Availability, AvailabilityTypes } from './availability';

const TEN_MINUTES_IN_MILLISECONDS = 10 * 60 * 1000;

jest.useFakeTimers();
jest.spyOn(global, 'setInterval');
jest.spyOn(global, 'clearInterval');

describe('Availability', () => {
    let reportMock: jest.Mock;

    beforeEach(() => {
        reportMock = jest.fn();
        Availability.clear();
        jest.clearAllMocks();
    });

    it('should initialize with the correct interval', () => {
        Availability.init(reportMock);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), TEN_MINUTES_IN_MILLISECONDS);
    });

    it('should call report with false when no error has occurred', () => {
        Availability.init(reportMock);
        jest.advanceTimersByTime(TEN_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: false, ERROR: false, SENTRY: false });
    });

    it('should call report with sentry:true when a sentry error has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        jest.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.SENTRY);
        jest.spyOn(Date, 'now').mockReturnValue(TEN_MINUTES_IN_MILLISECONDS + 2);
        jest.advanceTimersByTime(TEN_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: false, ERROR: false, SENTRY: true });
    });

    it('should call report with critical:true when a critical error has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        jest.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.CRITICAL);
        jest.spyOn(Date, 'now').mockReturnValue(TEN_MINUTES_IN_MILLISECONDS + 2);
        jest.advanceTimersByTime(TEN_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: true, ERROR: false, SENTRY: false });
    });

    it('should call report with error:true when an error has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        jest.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.ERROR);
        jest.spyOn(Date, 'now').mockReturnValue(TEN_MINUTES_IN_MILLISECONDS + 2);
        jest.advanceTimersByTime(TEN_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: false, ERROR: true, SENTRY: false });
    });

    it('should call report with every keys to true when an all kind of errors has occurred and 5 minutes have passed', () => {
        Availability.init(reportMock);
        jest.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.ERROR);
        Availability.mark(AvailabilityTypes.SENTRY);
        Availability.mark(AvailabilityTypes.CRITICAL);
        jest.spyOn(Date, 'now').mockReturnValue(TEN_MINUTES_IN_MILLISECONDS + 2);
        jest.advanceTimersByTime(TEN_MINUTES_IN_MILLISECONDS);
        expect(reportMock).toHaveBeenCalledWith({ CRITICAL: true, ERROR: true, SENTRY: true });
    });

    it('should call report with false when an error has occurred but 5 minutes have not passed', () => {
        Availability.init(reportMock);
        jest.spyOn(Date, 'now').mockReturnValue(1);
        Availability.mark(AvailabilityTypes.SENTRY);
        jest.spyOn(Date, 'now').mockReturnValue(TEN_MINUTES_IN_MILLISECONDS - 2);
        jest.advanceTimersByTime(TEN_MINUTES_IN_MILLISECONDS);
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

import { getMinScheduleTime } from './schedule';

describe('getMinScheduleTime', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('should get the correct min scheduled time if selected date is not today', () => {
        const fakeNow = new Date(2021, 0, 1, 9, 20, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        // Date which is currently selected is not today
        const date = new Date(2021, 0, 5, 9, 20, 0);
        const minTimeDate = getMinScheduleTime(date);

        // We expect the function to return undefined because if not today,
        // there is no min time (we want the whole interval from 00:00 to 23:30)
        const expectedMinTimeDate = undefined;

        expect(minTimeDate).toEqual(expectedMinTimeDate);
    });

    it('should get the correct min scheduled time if time < XX:30 and still in 2 minutes limit', () => {
        const fakeNow = new Date(2021, 0, 1, 9, 20, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const minTimeDate = getMinScheduleTime(fakeNow);
        const expectedMinTimeDate = new Date(2021, 0, 1, 9, 30, 0);

        expect(minTimeDate).toEqual(expectedMinTimeDate);
    });

    it('should get the correct min scheduled time if time < XX:30 and not in 2 minutes limit', () => {
        const fakeNow = new Date(2021, 0, 1, 9, 28, 30);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const minTimeDate = getMinScheduleTime(fakeNow);

        // We cannot schedule a message within the next 2 minutes, so if it's 9:28, we should return 10:00
        const expectedMinTimeDate = new Date(2021, 0, 1, 10, 0, 0);

        expect(minTimeDate).toEqual(expectedMinTimeDate);
    });

    it('should get the correct min scheduled time if time > XX:30 and still in 2 minutes limit', () => {
        const fakeNow = new Date(2021, 0, 1, 9, 55, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const minTimeDate = getMinScheduleTime(fakeNow);
        const expectedMinTimeDate = new Date(2021, 0, 1, 10, 0, 0);

        expect(minTimeDate).toEqual(expectedMinTimeDate);
    });

    it('should get the correct min scheduled time if time > XX:30 and not in 2 minutes limit', () => {
        const fakeNow = new Date(2021, 0, 1, 9, 58, 30);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const minTimeDate = getMinScheduleTime(fakeNow);

        // We cannot schedule a message within the next 2 minutes, so if it's 9:58, we should return 10:30
        const expectedMinTimeDate = new Date(2021, 0, 1, 10, 30, 0);

        expect(minTimeDate).toEqual(expectedMinTimeDate);
    });
});

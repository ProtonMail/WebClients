import { add, addHours, addMinutes, addSeconds, getUnixTime } from 'date-fns';

import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { clearAll, mailTestRender, tick } from '../../../helpers/test/helper';
import EOExpirationTime from './EOExpirationTime';

describe('EOExpirationTime', () => {
    const date = new Date(2023, 0, 1, 10, 0, 1);
    const seconds = 50;

    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        jest.clearAllTimers();
        jest.setSystemTime(date);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    const setup = async (ExpirationTime: number) => {
        const result = await mailTestRender(
            <EOExpirationTime message={{ localID: 'localID', data: { ExpirationTime } as Message }} />
        );
        const rerender = async (ExpirationTime: number) => {
            await result.rerender(
                <EOExpirationTime message={{ localID: 'localID', data: { ExpirationTime } as Message }} />
            );
            return result.queryByTestId('expiration-banner');
        };
        return { banner: result.queryByTestId('expiration-banner'), rerender };
    };

    it('should display expiration banner as button and expected content', async () => {
        // Set expiration time to two days
        const daysInSeconds = getUnixTime(
            add(date, {
                hours: 23,
                minutes: 59,
                seconds: 59,
            })
        );
        const result = await setup(daysInSeconds);
        let { banner } = result;

        // The message will expire in 1 day 23h 59min 59s, so we display "Expires in less than 24 hours"
        expect(banner?.textContent).toBe('Expires in less than 24 hours');

        // The message will expire in 0 day 3h 59min 59s, so we display "Expires in less than 4 hours"
        const hoursInSeconds1 = getUnixTime(addHours(date, 4));
        banner = await result.rerender(hoursInSeconds1);
        await tick();
        expect(banner?.textContent).toBe('Expires in less than 4 hours');

        // The message will expire in 0 day 1h 59min 59s, so we display "Expires in less than 2 hour"
        const hoursInSeconds2 = getUnixTime(addHours(date, 2));
        banner = await result.rerender(hoursInSeconds2);
        await tick();
        expect(banner?.textContent).toBe('Expires in less than 2 hours');

        // The message will expire in 0 day 0h 1min 59s, so we display "Expires in 2 minutes"
        const minutesInSeconds = getUnixTime(addMinutes(date, 2));
        banner = await result.rerender(minutesInSeconds);
        await tick();
        expect(banner?.textContent).toBe('Expires in 2 minutes');

        // The message will expire in 0 day 0h 0min Xs, so we display "Expires in less than X seconds"
        banner = await result.rerender(getUnixTime(addSeconds(date, seconds)));
        const value = Number(/\d+/.exec(banner?.textContent || '')?.[0]);
        await tick();
        expect(value).toBeLessThanOrEqual(seconds);
    });
});

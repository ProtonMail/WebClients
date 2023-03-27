import { addDays, addHours, addMinutes, addSeconds, getUnixTime } from 'date-fns';

import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { clearAll, render } from '../../../helpers/test/helper';
import EOExpirationTime from './EOExpirationTime';

describe('EOExpirationTime', () => {
    const seconds = 50;

    const setup = async (ExpirationTime: number) => {
        const result = await render(
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

    afterEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    it('should display expiration banner as button and expected content', async () => {
        // Set expiration time to two days
        const daysInSeconds = getUnixTime(addDays(new Date(), 1));
        const result = await setup(daysInSeconds);
        let { banner } = result;

        // The message will expire in 1 day 23h 59min 59s, so we display "Expires in less than 24 hours"
        expect(banner?.textContent).toBe('Expires in less than 24 hours');

        // The message will expire in 0 day 3h 59min 59s, so we display "Expires in less than 4 hours"
        const hoursInSeconds1 = getUnixTime(addHours(new Date(), 4));
        banner = await result.rerender(hoursInSeconds1);
        expect(banner?.textContent).toBe('Expires in less than 4 hours');

        // The message will expire in 0 day 1h 59min 59s, so we display "Expires in less than 2 hour"
        const hoursInSeconds2 = getUnixTime(addHours(new Date(), 2));
        banner = await result.rerender(hoursInSeconds2);
        expect(banner?.textContent).toBe('Expires in less than 2 hours');

        // The message will expire in 0 day 0h 1min 59s, so we display "Expires in 2 minutes"
        const minutesInSeconds = getUnixTime(addMinutes(new Date(), 2));
        banner = await result.rerender(minutesInSeconds);
        expect(banner?.textContent).toBe('Expires in 2 minutes');

        // The message will expire in 0 day 0h 0min Xs, so we display "Expires in less than X seconds"
        banner = await result.rerender(getUnixTime(addSeconds(new Date(), seconds)));
        const value = Number(/\d+/.exec(banner?.textContent || '')?.[0]);
        expect(value).toBeLessThanOrEqual(seconds);
    });
});

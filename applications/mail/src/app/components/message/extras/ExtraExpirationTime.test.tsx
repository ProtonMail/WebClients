import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { clearAll, render } from '../../../helpers/test/helper';
import ExtraExpirationTime from './ExtraExpirationTime';

const getExpirationTime = (numberOfSeconds: number) => {
    return new Date().getTime() / 1000 + numberOfSeconds;
};

describe('ExtraExpirationTime', () => {
    const seconds = 50;

    const setup = async (ExpirationTime: number, displayAsButton = false) => {
        const result = await render(
            <ExtraExpirationTime
                message={{ localID: 'localID', data: { ExpirationTime } as Message }}
                displayAsButton={displayAsButton}
            />
        );
        const rerender = async (ExpirationTime: number) => {
            await result.rerender(
                <ExtraExpirationTime
                    message={{ localID: 'localID', data: { ExpirationTime } as Message }}
                    displayAsButton={displayAsButton}
                />
            );
            return result.queryByTestId('expiration-banner');
        };
        return { banner: result.queryByTestId('expiration-banner'), rerender };
    };

    afterEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    it('should return no expiration if no expiration time', async () => {
        const { banner } = await setup(0);
        expect(banner).toBe(null);
    });

    it('should return the expiration message if there is expiration time', async () => {
        const ExpirationTime = getExpirationTime(seconds);
        const { banner } = await setup(ExpirationTime);
        expect(banner).not.toBe(null);

        const value = Number(/\d+/.exec(banner?.textContent || '')?.[0]);
        expect(value).toBeLessThanOrEqual(seconds);
    });

    it('should be able to react to new message', async () => {
        const ExpirationTime = getExpirationTime(seconds);
        const result = await setup(0);
        let { banner } = result;
        expect(banner).toBe(null);
        banner = await result.rerender(ExpirationTime);
        expect(banner).not.toBe(null);
        banner = await result.rerender(0);
        expect(banner).toBe(null);
    });

    it('should display expiration banner as button and expected content', async () => {
        // Set expiration time to two days
        const daysInSeconds = 60 * 60 * 24 * 2;

        const result = await setup(getExpirationTime(daysInSeconds), true);
        let { banner } = result;

        // The message will expire in 1 day 23h 59min 59s, so we display "Expires in 1 day"
        expect(banner?.textContent).toBe('Expires in 1 day');

        // The message will expire in 0 day 3h 59min 59s, so we display "Expires in 3 hours"
        const hoursInSeconds1 = 60 * 60 * 4;
        banner = await result.rerender(getExpirationTime(hoursInSeconds1));
        expect(banner?.textContent).toBe('Expires in 3 hours');

        // The message will expire in 0 day 1h 59min 59s, so we display "Expires in less than 1 hour"
        const hoursInSeconds2 = 60 * 60 * 2;
        banner = await result.rerender(getExpirationTime(hoursInSeconds2));
        expect(banner?.textContent).toBe('Expires in less than 1 hour');

        // The message will expire in 0 day 0h 1min 59s, so we display "Expires in less than 1 minute"
        const minutesInSeconds = 60 * 2;
        banner = await result.rerender(getExpirationTime(minutesInSeconds));
        expect(banner?.textContent).toBe('Expires in less than 1 minute');

        // The message will expire in 0 day 0h 0min Xs, so we display "Expires in less than X seconds"
        banner = await result.rerender(getExpirationTime(seconds));
        const value = Number(/\d+/.exec(banner?.textContent || '')?.[0]);
        expect(value).toBeLessThanOrEqual(seconds);
    });
});

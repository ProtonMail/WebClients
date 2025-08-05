import { screen } from '@testing-library/react';

import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { clearAll, mailTestRender } from '../../../../../helpers/test/helper';
import ExtraExpirationTime from './ExtraExpirationTime';

const getExpirationTime = (numberOfSeconds: number) => {
    return new Date().getTime() / 1000 + numberOfSeconds;
};

describe('ExtraExpirationTime', () => {
    const seconds = 50;

    const setup = async (ExpirationTime: number) => {
        const view = await mailTestRender(
            <ExtraExpirationTime message={{ localID: 'localID', data: { ExpirationTime } as Message }} />
        );
        const rerender = async (ExpirationTime: number) => {
            await view.rerender(
                <ExtraExpirationTime message={{ localID: 'localID', data: { ExpirationTime } as Message }} />
            );
            return screen.queryByTestId('expiration-banner');
        };
        return { banner: screen.queryByTestId('expiration-banner'), rerender };
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
});

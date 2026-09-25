import { createActor, createMachine } from 'xstate';

import { AuthDeviceInvalidError } from '@proton/shared/lib/keys/device';

import type { SignInActorServices } from '../../../state-machine/signInActors';
import type { SignInAuthState } from '../../../state-machine/signInAuthState';
import { createSSOActors } from './ssoActors';
import type { SSODeviceEvent } from './ssoStateMachine';

// Each poll asks whether another device or an administrator approved this one
const mockGetAuthDeviceDataByUser = jest.fn();
jest.mock('@proton/shared/lib/keys/device', () => ({
    ...jest.requireActual('@proton/shared/lib/keys/device'),
    getAuthDeviceDataByUser: () => mockGetAuthDeviceDataByUser(),
    deleteAuthDevice: () => Promise.resolve(),
}));

const POLL_INTERVAL = 10_000;

/**
 * Runs the approval polling as the SSO machine does: a device event other than a pending approval ends the wait,
 * which stops the polling.
 */
const startPolling = () => {
    const received: SSODeviceEvent[] = [];
    const { waitForDeviceApproval } = createSSOActors({ api: jest.fn() } as unknown as SignInActorServices);
    const parent = createMachine({
        initial: 'waiting',
        states: {
            waiting: {
                invoke: {
                    src: waitForDeviceApproval,
                    input: { auth: { account: { user: {} } } as SignInAuthState },
                },
                on: {
                    '*': { target: 'answered', actions: ({ event }) => received.push(event as SSODeviceEvent) },
                },
            },
            answered: {},
        },
    });
    createActor(parent).start();
    return { received };
};

/** The next polls fail with these errors, one each. */
const failPolls = (...errors: unknown[]) => {
    errors.forEach((error) => mockGetAuthDeviceDataByUser.mockRejectedValueOnce(error));
};

describe('waitForDeviceApproval', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockGetAuthDeviceDataByUser.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // A 401 comes once the API layer failed to refresh the session; retried with a new one, the request gets a 403
    it.each([401, 403])('ends the attempt when a poll gets a %i, and stops polling', async (status) => {
        const pending = { status: 422 };
        const error = { status };
        failPolls(pending, pending, error);
        const { received } = startPolling();

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL * 2);
        expect(received).toEqual([]);

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL);
        expect(received).toEqual([{ type: 'sso.device.failed', error }]);

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL * 3);
        expect(mockGetAuthDeviceDataByUser).toHaveBeenCalledTimes(3);
    });

    it('shows the rejection when the device is no longer valid', async () => {
        failPolls(new AuthDeviceInvalidError('device', 'Missing device'));
        const { received } = startPolling();

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL);
        expect(received).toEqual([{ type: 'sso.device.rejected' }]);
    });

    it('keeps polling through other errors', async () => {
        failPolls({ status: 422 }, new Error('offline'), { status: 500 });
        const { received } = startPolling();

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL * 3);
        expect(received).toEqual([]);
        expect(mockGetAuthDeviceDataByUser).toHaveBeenCalledTimes(3);
    });
});

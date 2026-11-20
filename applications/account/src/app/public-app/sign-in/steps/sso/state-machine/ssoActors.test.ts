import { createActor, createMachine } from 'xstate';

import { AuthDeviceInvalidError } from '@proton/shared/lib/keys/device';

import type { SignInActorServices } from '../../../state-machine/signInActors';
import type { SignInAuthState } from '../../../state-machine/signInAuthState';
import { createSSOActors } from './ssoActors';
import type { SSODeviceEvent } from './ssoStateMachine';

// Each poll asks whether another device or an administrator approved this one
const mockGetAuthDeviceDataByUser = vi.fn();
vi.mock('@proton/shared/lib/keys/device', async () => ({
    ...(await vi.importActual<any>('@proton/shared/lib/keys/device')),
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
    const { waitForDeviceApproval } = createSSOActors({ api: vi.fn() } as unknown as SignInActorServices);
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
        vi.useFakeTimers();
        mockGetAuthDeviceDataByUser.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // A session that can't read the device any more; an expired one has started the sign-in over before this
    it.each([401, 403])('ends the attempt when a poll gets a %i, and stops polling', async (status) => {
        const pending = { status: 422 };
        const error = { status };
        failPolls(pending, pending, error);
        const { received } = startPolling();

        await vi.advanceTimersByTimeAsync(POLL_INTERVAL * 2);
        expect(received).toEqual([]);

        await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
        expect(received).toEqual([{ type: 'sso.device.failed', payload: { error } }]);

        await vi.advanceTimersByTimeAsync(POLL_INTERVAL * 3);
        expect(mockGetAuthDeviceDataByUser).toHaveBeenCalledTimes(3);
    });

    it('shows the rejection when the device is no longer valid', async () => {
        failPolls(new AuthDeviceInvalidError('device', 'Missing device'));
        const { received } = startPolling();

        await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
        expect(received).toEqual([{ type: 'sso.device.rejected' }]);
    });

    it('keeps polling through other errors', async () => {
        failPolls({ status: 422 }, new Error('offline'), { status: 500 });
        const { received } = startPolling();

        await vi.advanceTimersByTimeAsync(POLL_INTERVAL * 3);
        expect(received).toEqual([]);
        expect(mockGetAuthDeviceDataByUser).toHaveBeenCalledTimes(3);
    });
});

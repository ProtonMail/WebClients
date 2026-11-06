import { createActor, fromCallback, fromPromise, waitFor } from 'xstate';

import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import type { JoinMagicLinkData } from './joinMagicLinkActors';
import { type JoinMagicLinkEmitted, MissingTokenError, joinMagicLinkStateMachine } from './joinMagicLinkStateMachine';

const apiError = (data: { Code?: number; Error?: string }, status = 422) =>
    Object.assign(new Error(data.Error), { status, data });

const cleanup = jest.fn();
const data = { organizationData: { logo: { url: 'blob:logo', cleanup } } } as unknown as JoinMagicLinkData;

const start = ({
    prepare = async () => data,
    setUp = async () => {},
}: {
    prepare?: () => Promise<JoinMagicLinkData>;
    setUp?: (input: { password: string }) => Promise<void>;
}) => {
    const redirectToSignIn = jest.fn();
    const emitted: JoinMagicLinkEmitted[] = [];
    const actor = createActor(
        joinMagicLinkStateMachine.provide({
            actors: {
                prepare: fromPromise(prepare),
                holdLogo: fromCallback(
                    ({ input }) =>
                        () =>
                            input?.cleanup()
                ),
                setUp: fromPromise(({ input }) => setUp(input)),
            },
            actions: { redirectToSignIn },
        })
    );
    actor.on('*', (event) => emitted.push(event));
    actor.start();
    return { actor, redirectToSignIn, emitted };
};

describe('joinMagicLinkStateMachine', () => {
    beforeEach(() => cleanup.mockClear());

    it('asks for a password once the link is read, and sets up the member with it', async () => {
        const setUp = jest.fn(() => new Promise<void>(() => {}));
        const { actor } = start({ setUp });
        await waitFor(actor, (state) => state.matches({ joining: 'awaitingPassword' }));
        actor.send({ type: 'password.submitted', password: 'password' });
        expect(actor.getSnapshot().matches({ joining: 'settingUp' })).toBe(true);
        expect(setUp).toHaveBeenCalledWith(expect.objectContaining({ data, password: 'password' }));
    });

    it('releases the logo when the page closes', async () => {
        const { actor } = start({});
        await waitFor(actor, (state) => state.matches('joining'));
        actor.stop();
        expect(cleanup).toHaveBeenCalled();
    });

    it.each([
        ['an expired link', apiError({ Code: API_CUSTOM_ERROR_CODES.JWT_EXPIRED, Error: 'Expired' }), 'expired'],
        [
            'an account that already joined',
            apiError({ Code: API_CUSTOM_ERROR_CODES.ALREADY_EXISTS, Error: 'Already exists' }),
            'used',
        ],
        ['a link without a token', new MissingTokenError(), 'unknown'],
    ])('shows %s', async (_, error, expected) => {
        const { actor, emitted } = start({ prepare: () => Promise.reject(error) });
        await waitFor(actor, (state) => state.matches('failed'));
        expect(actor.getSnapshot().context.error).toBe(expected);
        expect(emitted).toEqual([]);
    });

    it('tells a member who already joined to sign in', async () => {
        const error = apiError({ Code: API_CUSTOM_ERROR_CODES.JWT_REDIRECT_LOGIN, Error: 'Please sign in' });
        const { actor, redirectToSignIn, emitted } = start({ prepare: () => Promise.reject(error) });
        await waitFor(actor, (state) => state.matches('failed'));
        expect(actor.getSnapshot().context.error).toBe('used');
        expect(emitted).toEqual([{ type: 'link.used', message: 'Please sign in' }]);
        expect(redirectToSignIn).toHaveBeenCalled();
    });

    it('reports an unexpected error', async () => {
        const error = new Error('Network error');
        const { actor, emitted } = start({ prepare: () => Promise.reject(error) });
        await waitFor(actor, (state) => state.matches('failed'));
        expect(actor.getSnapshot().context.error).toBe('unknown');
        expect(emitted).toEqual([{ type: 'error', error }]);
    });

    it('asks to refresh when the link session expires during setup, and keeps the form', async () => {
        const { actor, emitted } = start({ setUp: () => Promise.reject(apiError({}, 401)) });
        await waitFor(actor, (state) => state.matches({ joining: 'awaitingPassword' }));
        actor.send({ type: 'password.submitted', password: 'password' });
        await waitFor(actor, (state) => state.matches({ joining: 'awaitingPassword' }));
        expect(emitted).toEqual([{ type: 'session.expired' }]);
    });
});

import { createActor, fromCallback, fromPromise, waitFor } from 'xstate';

import type { TokenRedemptionSession } from './tokenRedemptionActors';
import {
    type TokenRedemptionConfig,
    type TokenRedemptionEmitted,
    selectResending,
    selectSessionExpired,
    selectStep,
    selectSubmitting,
    tokenRedemptionStateMachine,
} from './tokenRedemptionStateMachine';

const config: TokenRedemptionConfig = {
    token: 'token',
    password: 'link-password',
    domain: 'example.com',
    orgName: 'Org',
    username: 'jane',
};
const session = { user: { ID: 'user' } } as unknown as TokenRedemptionSession;

const start = ({
    invalidLink = false,
    redeemToken = async () => {},
    verifyCode = async () => ({ session, passwordPolicies: [] }),
    changePassword = async () => {},
}: {
    invalidLink?: boolean;
    redeemToken?: (input: { email: string; config: TokenRedemptionConfig | undefined }) => Promise<void>;
    verifyCode?: (input: {
        code: string;
        config: TokenRedemptionConfig | undefined;
    }) => Promise<{ session: TokenRedemptionSession; passwordPolicies: [] }>;
    changePassword?: (input: { session: TokenRedemptionSession | undefined; password: string }) => Promise<void>;
}) => {
    const actions = { clearLinkFromUrl: jest.fn() };
    const emitted: TokenRedemptionEmitted[] = [];
    // Set while a step listens for the session expiring
    let expireSession = () => {};
    const actor = createActor(
        tokenRedemptionStateMachine.provide({
            actors: {
                watchSession: fromCallback(({ sendBack }) => {
                    expireSession = () => sendBack({ type: 'session.expired' });
                }),
                redeemToken: fromPromise(({ input }) => redeemToken(input)),
                verifyCode: fromPromise(({ input }) => verifyCode(input)),
                changePassword: fromPromise(({ input }) => changePassword(input)),
            },
            actions: {
                clearLinkFromUrl: actions.clearLinkFromUrl,
            },
        }),
        { input: { config: invalidLink ? undefined : config } }
    );
    actor.on('*', (event) => emitted.push(event));
    actor.start();
    return { actor, actions, emitted, expireSession: () => expireSession() };
};

describe('tokenRedemptionStateMachine', () => {
    it('stops on an invalid link, removing it from the address bar', () => {
        const { actor, actions } = start({ invalidLink: true });
        expect(actor.getSnapshot().matches('invalid')).toBe(true);
        expect(actions.clearLinkFromUrl).toHaveBeenCalled();
    });

    it('goes from email to code to password, then signs in', async () => {
        const redeemToken = jest.fn(async () => {});
        const verifyCode = jest.fn(async () => ({ session, passwordPolicies: [] as [] }));
        const changePassword = jest.fn(async () => {});
        const { actor, actions } = start({ redeemToken, verifyCode, changePassword });
        expect(actions.clearLinkFromUrl).toHaveBeenCalled();

        actor.send({ type: 'email.submitted', email: 'jane@example.com' });
        expect(selectSubmitting(actor.getSnapshot())).toBe(true);
        await waitFor(actor, (state) => selectStep(state) === 'otp');
        expect(redeemToken).toHaveBeenCalledWith({ email: 'jane@example.com', config });

        actor.send({ type: 'code.submitted', code: '123456' });
        await waitFor(actor, (state) => state.matches('password'));
        expect(verifyCode).toHaveBeenCalledWith({ code: '123456', config });

        actor.send({ type: 'password.submitted', password: 'new-password' });
        expect(changePassword).toHaveBeenCalledWith({ session, password: 'new-password' });
        await changePassword.mock.results[0].value;
        // Signed in: the form stays loading while the page leaves
        expect(actor.getSnapshot().matches({ password: 'changing' })).toBe(true);
        expect(selectSubmitting(actor.getSnapshot())).toBe(true);
    });

    it('resends the code to the submitted email', async () => {
        const redeemToken = jest.fn(async () => {});
        const { actor, emitted } = start({ redeemToken });
        actor.send({ type: 'email.submitted', email: 'jane@example.com' });
        await waitFor(actor, (state) => state.matches({ otp: 'idle' }));

        actor.send({ type: 'code.resendRequested' });
        expect(selectResending(actor.getSnapshot())).toBe(true);
        await waitFor(actor, (state) => state.matches({ otp: 'idle' }));
        expect(redeemToken).toHaveBeenCalledTimes(2);
        expect(emitted).toEqual([{ type: 'code.resent' }]);
    });

    it('goes back to the email', async () => {
        const { actor } = start({});
        actor.send({ type: 'email.submitted', email: 'jane@example.com' });
        await waitFor(actor, (state) => state.matches('otp'));
        actor.send({ type: 'back' });
        expect(actor.getSnapshot().matches({ email: 'idle' })).toBe(true);
    });

    it('reports a failed step and lets the member retry', async () => {
        const error = new Error('Wrong code');
        const { actor, emitted } = start({ verifyCode: () => Promise.reject(error) });
        actor.send({ type: 'email.submitted', email: 'jane@example.com' });
        await waitFor(actor, (state) => state.matches('otp'));
        actor.send({ type: 'code.submitted', code: '000000' });
        await waitFor(actor, (state) => state.matches({ otp: 'idle' }));
        expect(emitted).toEqual([{ type: 'error', error }]);
    });

    it('tells the member the session expired when setting the password', async () => {
        const error = Object.assign(new Error('Unauthorized'), { status: 401, data: {} });
        const { actor, emitted } = start({ changePassword: () => Promise.reject(error) });
        actor.send({ type: 'email.submitted', email: 'jane@example.com' });
        await waitFor(actor, (state) => state.matches('otp'));
        actor.send({ type: 'code.submitted', code: '123456' });
        await waitFor(actor, (state) => state.matches('password'));
        actor.send({ type: 'password.submitted', password: 'new-password' });
        await waitFor(actor, (state) => state.matches({ password: 'idle' }));
        expect(emitted).toEqual([{ type: 'session.expired' }]);
    });

    describe('when the unauthenticated session expires on the code step', () => {
        const toCodeStep = async (actor: ReturnType<typeof start>['actor']) => {
            actor.send({ type: 'email.submitted', email: 'jane@example.com' });
            await waitFor(actor, (state) => state.matches({ otp: 'idle' }));
        };

        it('goes back to the email step, which says why', async () => {
            const { actor, emitted, expireSession } = start({});
            await toCodeStep(actor);

            expireSession();

            expect(actor.getSnapshot().matches({ email: 'idle' })).toBe(true);
            expect(selectSessionExpired(actor.getSnapshot())).toBe(true);
            expect(emitted).toEqual([]);
        });

        it("drops the code check that met it, so that check's 401 isn't reported as well", async () => {
            let failCodeCheck: (error: unknown) => void = () => {};
            const { actor, emitted, expireSession } = start({
                verifyCode: () =>
                    new Promise<never>((_, reject) => {
                        failCodeCheck = reject;
                    }),
            });
            await toCodeStep(actor);
            actor.send({ type: 'code.submitted', code: '123456' });

            expireSession();
            failCodeCheck(Object.assign(new Error('Unauthorized'), { status: 401, data: {} }));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(actor.getSnapshot().matches({ email: 'idle' })).toBe(true);
            expect(emitted).toEqual([]);
        });

        it('stops saying why once the member edits or submits the email', async () => {
            const { actor, expireSession } = start({});
            const expireOnCodeStep = async () => {
                await toCodeStep(actor);
                expireSession();
                expect(selectSessionExpired(actor.getSnapshot())).toBe(true);
            };

            await expireOnCodeStep();
            actor.send({ type: 'email.edited' });
            expect(selectSessionExpired(actor.getSnapshot())).toBe(false);

            await expireOnCodeStep();
            actor.send({ type: 'email.submitted', email: 'jane@example.com' });
            expect(selectSessionExpired(actor.getSnapshot())).toBe(false);
        });
    });
});

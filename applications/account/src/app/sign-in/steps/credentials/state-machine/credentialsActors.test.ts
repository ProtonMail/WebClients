import { createActor, toPromise } from 'xstate';

import type { SignInActorServices } from '../../../state-machine/signInActors';
import { createCredentialsActors } from './credentialsActors';

/** A promise the test settles by hand, to control when the preparation finishes. */
const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

const makeServices = (prepare: () => Promise<void>) => {
    const services = {
        api: jest.fn((): Promise<unknown> => Promise.resolve({ Modulus: 'm' })),
        startAuth: jest.fn(() => Promise.resolve()),
        prepare,
    };
    return services;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createCredentialsActors', () => {
    it('waits for the preparation before the first request of an attempt', async () => {
        const preparation = deferred();
        const services = makeServices(() => preparation.promise);
        const actors = createCredentialsActors(services as unknown as SignInActorServices);
        const actor = createActor(actors.fetchAccountType, { input: { username: 'user@example.com' } }).start();
        await flush();
        expect(services.startAuth).not.toHaveBeenCalled();
        expect(services.api).not.toHaveBeenCalled();
        preparation.resolve();
        await toPromise(actor);
        expect(services.startAuth).toHaveBeenCalledTimes(1);
        expect(services.api).toHaveBeenCalledTimes(1);
    });

    it('tells an SSO account from a password account, and fails on anything else', async () => {
        const services = makeServices(() => Promise.resolve());
        const actors = createCredentialsActors(services as unknown as SignInActorServices);
        const run = () => toPromise(createActor(actors.fetchAccountType, { input: { username: 'user' } }).start());

        services.api.mockResolvedValueOnce({ SSOChallengeToken: 'challenge' });
        await expect(run()).resolves.toEqual({ type: 'sso', ssoInfo: { SSOChallengeToken: 'challenge' } });
        services.api.mockResolvedValueOnce({ Modulus: 'm' });
        await expect(run()).resolves.toEqual({ type: 'srp' });
        services.api.mockResolvedValueOnce({});
        await expect(run()).rejects.toThrow('Invalid response from server');
    });

    it('waits for the preparation before exchanging the identity provider token', async () => {
        const preparation = deferred();
        const services = makeServices(() => preparation.promise);
        const actors = createCredentialsActors(services as unknown as SignInActorServices);
        const actor = createActor(actors.authenticateWithSSOToken, {
            input: { uid: undefined, token: 'redirect-token', username: '', persistent: false },
        }).start();
        await flush();
        expect(services.api).not.toHaveBeenCalled();
        preparation.resolve();
        await toPromise(actor);
        expect(services.api).toHaveBeenCalledTimes(1);
    });
});

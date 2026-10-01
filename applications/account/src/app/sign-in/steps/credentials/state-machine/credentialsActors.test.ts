import { createActor, toPromise } from 'xstate';

import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import type { SignInActorServices } from '../../../state-machine/signInActors';
import { createCredentialsActors } from './credentialsActors';
import { SwitchToSRPError, SwitchToSSOError } from './credentialsErrors';

/** A promise the test settles by hand, to control when the preparation finishes. */
const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

const makeServices = (preparePage: () => Promise<void>) => {
    const services = {
        api: jest.fn((): Promise<unknown> => Promise.resolve({ Modulus: 'm' })),
        prepareAttempt: jest.fn(() => Promise.resolve()),
        preparePage,
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
        expect(services.prepareAttempt).not.toHaveBeenCalled();
        expect(services.api).not.toHaveBeenCalled();
        preparation.resolve();
        await toPromise(actor);
        expect(services.prepareAttempt).toHaveBeenCalledTimes(1);
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

    it("throws the API's answers the machine acts on as their own errors, with the API's message", async () => {
        const services = makeServices(() => Promise.resolve());
        const actors = createCredentialsActors(services as unknown as SignInActorServices);
        const apiError = (code: number) => ({ data: { Code: code, Error: `error ${code}` } });

        services.api.mockRejectedValueOnce(apiError(API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO));
        const switchToSSO = toPromise(createActor(actors.fetchAccountType, { input: { username: 'user' } }).start());
        await expect(switchToSSO).rejects.toThrow(SwitchToSSOError);
        await expect(switchToSSO).rejects.toThrow(`error ${API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO}`);

        services.api.mockRejectedValueOnce(apiError(API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SRP));
        await expect(
            toPromise(createActor(actors.fetchSSOInfo, { input: { username: 'user' } }).start())
        ).rejects.toThrow(SwitchToSRPError);

        // Any other error stays as it is
        const other = { data: { Code: 2000, Error: 'Something else' } };
        services.api.mockRejectedValueOnce(other);
        await expect(
            toPromise(createActor(actors.fetchAccountType, { input: { username: 'user' } }).start())
        ).rejects.toBe(other);
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

    it('fails the provider window without the challenge token, rather than open it empty', async () => {
        const actors = createCredentialsActors(makeServices(() => Promise.resolve()) as unknown as SignInActorServices);
        const actor = createActor(actors.authorizeWithSSOProvider, { input: { token: undefined } }).start();
        await expect(toPromise(actor)).rejects.toThrow('Missing SSO challenge token');
    });

    it('fails the token exchange without a token, before any request', async () => {
        const services = makeServices(() => Promise.resolve());
        const actors = createCredentialsActors(services as unknown as SignInActorServices);
        const actor = createActor(actors.authenticateWithSSOToken, {
            input: { uid: undefined, token: undefined, username: '', persistent: false },
        }).start();
        await expect(toPromise(actor)).rejects.toThrow('Missing SSO token');
        expect(services.api).not.toHaveBeenCalled();
    });
});

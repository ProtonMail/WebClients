import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { createOfflineError, createTimeoutError } from '@proton/shared/lib/fetch/ApiError';
import type { Api } from '@proton/shared/lib/interfaces';

import { ClaimedAddressNoMatchError, loginWithClaimedAddress, loginWithPassword } from './passwordLogin';

jest.mock('@proton/shared/lib/authentication/loginWithFallback', () => ({
    __esModule: true,
    default: jest.fn(),
}));
const mockLoginWithFallback = jest.mocked(loginWithFallback);

const apiError = (status: number, code: number) => ({ status, data: { Code: code, Error: `error ${code}` } });
const wrongPassword = apiError(422, API_CUSTOM_ERROR_CODES.INVALID_LOGIN);

const EMAIL = 'eric@domain.com';

/** The auth info for each username, or each candidate sent with it: its own, or the error it fails with. */
const makeApi = (failures: Record<string, unknown> = {}, claimedAddresses?: string[]) =>
    jest.fn(async ({ data }: { data: { Username: string; ClaimedAddressID?: string } }) => {
        const key = data.ClaimedAddressID ?? data.Username;
        if (failures[key]) {
            throw failures[key];
        }
        return { Username: data.Username, ClaimedAddresses: data.ClaimedAddressID ? [] : claimedAddresses };
    }) as unknown as Api;

/** The sign-in for each username, or each candidate sent with it: signed in, or the error it fails with. */
const signIn = (outcomes: Record<string, unknown>) => {
    mockLoginWithFallback.mockImplementation(async ({ credentials, claimedAddressID }) => {
        const key = claimedAddressID ?? credentials.username;
        const outcome = outcomes[key];
        if (outcome !== 'ok') {
            throw outcome;
        }
        return { authVersion: 4, result: { UID: key } } as any;
    });
};

/** Fails with no candidate matching, for the given reason. */
const expectNoMatch = async (promise: Promise<unknown>, cause: unknown) => {
    const error = await promise.then(
        () => undefined,
        (reason: unknown) => reason
    );
    expect(error).toBeInstanceOf(ClaimedAddressNoMatchError);
    expect((error as Error).cause).toBe(cause);
};

const login = (api: Api, signal?: AbortSignal) =>
    loginWithClaimedAddress({
        email: EMAIL,
        claimedAddressIDs: ['first', 'second'],
        password: 'secret',
        payload: {},
        persistent: false,
        api,
        signal,
    });

describe('loginWithClaimedAddress', () => {
    beforeEach(() => {
        mockLoginWithFallback.mockReset();
    });

    it('signs in with the candidate that accepts the password', async () => {
        signIn({ first: wrongPassword, second: 'ok' });

        await expect(login(makeApi())).resolves.toEqual(expect.objectContaining({ id: 'second', authVersion: 4 }));
    });

    it('sends each candidate as its own field, with the email it was returned for as the username', async () => {
        signIn({ first: 'ok' });
        const api = makeApi();

        await login(api);

        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ Username: EMAIL, ClaimedAddressID: 'first' }) })
        );
        expect(mockLoginWithFallback).toHaveBeenCalledWith(
            expect.objectContaining({ credentials: { username: EMAIL, password: 'secret' }, claimedAddressID: 'first' })
        );
    });

    it('fails with the wrong password when no candidate accepts it', async () => {
        signIn({ first: wrongPassword, second: wrongPassword });

        await expectNoMatch(login(makeApi()), wrongPassword);
    });

    it('moves on from a candidate that fails before its password is checked', async () => {
        // The SRP checks reject this candidate's auth info without a request
        signIn({ first: new Error('SRP server ephemeral is out of bounds'), second: 'ok' });

        await expect(login(makeApi())).resolves.toEqual(expect.objectContaining({ id: 'second' }));
    });

    it('moves on from a candidate whose auth info fails', async () => {
        signIn({ second: 'ok' });

        await expect(login(makeApi({ first: apiError(422, 2011) }))).resolves.toEqual(
            expect.objectContaining({ id: 'second' })
        );
        expect(mockLoginWithFallback).toHaveBeenCalledTimes(1);
    });

    it('reports a wrong password over a candidate that could not be tried', async () => {
        signIn({ second: wrongPassword });

        await expectNoMatch(login(makeApi({ first: apiError(422, 2011) })), wrongPassword);
    });

    it("fails with the first candidate's error when none could be tried", async () => {
        const unusable = apiError(422, 2011);

        await expectNoMatch(login(makeApi({ first: unusable, second: apiError(422, 2012) })), unusable);
    });

    it.each([
        ['SSO', API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO],
        ['SRP', API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SRP],
    ])('moves on from a candidate that signs in with %s instead', async (_, code) => {
        signIn({ first: apiError(422, code), second: 'ok' });

        await expect(login(makeApi())).resolves.toEqual(expect.objectContaining({ id: 'second' }));
    });

    it('stops at a sign-in failure other than a wrong password: the password was right', async () => {
        const disabled = apiError(422, 10003);
        signIn({ first: disabled, second: 'ok' });

        await expect(login(makeApi())).rejects.toBe(disabled);
        expect(mockLoginWithFallback).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['offline', createOfflineError({})],
        ['timed out', createTimeoutError({})],
        ['failed on the network', Object.assign(new Error('Network error'), { name: 'NetworkError' })],
        ['stopped', Object.assign(new Error('Aborted'), { name: 'AbortError' })],
        ['rate limited', apiError(429, 2028)],
        ['asked for human verification', apiError(422, API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED)],
    ])('stops when the request fails for every candidate: %s', async (_, error) => {
        signIn({ second: 'ok' });

        await expect(login(makeApi({ first: error }))).rejects.toBe(error);
        expect(mockLoginWithFallback).not.toHaveBeenCalled();
    });

    it("sends the sign-in's signal with every request, so stopping the sign-in aborts the one in flight", async () => {
        const { signal } = new AbortController();
        signIn({ first: 'ok' });
        const api = makeApi();

        await login(api, signal);

        expect(api).toHaveBeenCalledWith(expect.objectContaining({ signal }));
        // The candidate's sign-in makes its requests through an API that adds it too
        const [[{ api: signInApi }]] = mockLoginWithFallback.mock.calls;
        await signInApi({ url: 'core/v4/auth', data: { Username: EMAIL } });
        expect(api).toHaveBeenLastCalledWith(expect.objectContaining({ url: 'core/v4/auth', signal }));
    });

    it('stops a stopped sign-in without AbortSignal.throwIfAborted, which our oldest targets lack', async () => {
        // Safari before 15.4 and Chrome before 100 have neither throwIfAborted nor reason
        const signal = { aborted: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
        const api = makeApi();

        const error = await login(api, signal as unknown as AbortSignal).catch((reason: unknown) => reason);

        expect((error as Error).name).toBe('AbortError');
        expect(api).not.toHaveBeenCalled();
    });

    it('stops between candidates once the sign-in is stopped', async () => {
        const controller = new AbortController();
        mockLoginWithFallback.mockImplementation(async () => {
            controller.abort();
            throw wrongPassword;
        });

        await expect(login(makeApi(), controller.signal)).rejects.toThrow();
        expect(mockLoginWithFallback).toHaveBeenCalledTimes(1);
    });
});

describe('loginWithPassword', () => {
    const typed = EMAIL;
    const login = (api: Api) =>
        loginWithPassword({ username: typed, password: 'secret', payload: {}, persistent: false, api });

    beforeEach(() => {
        mockLoginWithFallback.mockReset();
    });

    it("signs in to the username's account", async () => {
        signIn({ [typed]: 'ok' });

        await expect(login(makeApi({}, ['first']))).resolves.toEqual(
            expect.objectContaining({ authVersion: 4, claimedAddressID: undefined })
        );
        expect(mockLoginWithFallback).toHaveBeenCalledTimes(1);
    });

    it('signs in to the account a claimed address belonged to when the password is its', async () => {
        signIn({ [typed]: wrongPassword, first: wrongPassword, second: 'ok' });

        await expect(login(makeApi({}, ['first', 'second']))).resolves.toEqual(
            expect.objectContaining({ claimedAddressID: 'second' })
        );
        // Still with the address the user typed
        expect(mockLoginWithFallback).toHaveBeenLastCalledWith(
            expect.objectContaining({
                credentials: { username: typed, password: 'secret' },
                claimedAddressID: 'second',
            })
        );
    });

    it("fails with the username's wrong password when no claimed address matches", async () => {
        const typedWrongPassword = apiError(422, API_CUSTOM_ERROR_CODES.INVALID_LOGIN);
        signIn({ [typed]: typedWrongPassword, first: wrongPassword });

        await expect(login(makeApi({}, ['first']))).rejects.toBe(typedWrongPassword);
    });

    it("fails with the username's wrong password when no claimed address could even be tried", async () => {
        signIn({ [typed]: wrongPassword });

        await expect(login(makeApi({ first: apiError(422, 2011) }, ['first']))).rejects.toBe(wrongPassword);
    });

    it('fails with what stopped the claimed addresses when it would stop any sign-in', async () => {
        const rateLimited = apiError(429, 2028);
        signIn({ [typed]: wrongPassword });

        await expect(login(makeApi({ first: rateLimited }, ['first']))).rejects.toBe(rateLimited);
    });

    it('tries no claimed address for anything but a wrong password', async () => {
        const disabled = apiError(422, 10003);
        signIn({ [typed]: disabled, first: 'ok' });

        await expect(login(makeApi({}, ['first']))).rejects.toBe(disabled);
        expect(mockLoginWithFallback).toHaveBeenCalledTimes(1);
    });

    it('fails with the wrong password when no address was claimed', async () => {
        signIn({ [typed]: wrongPassword });

        await expect(login(makeApi())).rejects.toBe(wrongPassword);
        expect(mockLoginWithFallback).toHaveBeenCalledTimes(1);
    });
});

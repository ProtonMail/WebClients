import { createActor, fromCallback, fromPromise, setup, waitFor } from 'xstate';

import { PasswordError, TOTPError } from '@proton/shared/lib/authentication/error';
import type { SSOInfoResponse } from '@proton/shared/lib/authentication/interface';
import { ExternalSSOError } from '@proton/shared/lib/authentication/ssoExternalLogin';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Address, KeySalt, User } from '@proton/shared/lib/interfaces';
import { getRequiresPasswordSetup } from '@proton/shared/lib/keys';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';

import type { AuthSession } from '../../content/authSession';
import {
    AuthType,
    type AuthTypeData,
    type SSODataTypes,
    SSOLoginCapabilites,
    type SSOSetPasswordData,
} from '../auth/interface';
import type { PrepareSSOResult, SSOSignInResult } from '../auth/sso';
import type {
    AccountType,
    CredentialsFormValues,
    PrimaryAuthResult,
    SSOProviderResult,
    UsernameFormValues,
} from '../steps/credentials/state-machine/credentialsActors';
import { credentialsStateMachine, selectAuthType } from '../steps/credentials/state-machine/credentialsStateMachine';
import { lost2FAStateMachine } from '../steps/password-account/screens/lost-two-factor/state-machine/lost2FAStateMachine';
import { passwordAccountStateMachine } from '../steps/password-account/state-machine/passwordAccountStateMachine';
import { type SSODeviceEvent, SSOStateMachineTags, ssoStateMachine } from '../steps/sso/state-machine/ssoStateMachine';
import { type SignInMachineEmitted, type SignInMachineInput, SignInStateMachine } from './SignInStateMachine';
import type { CreatedAuth } from './signInActors';
import type { SignInAuthState } from './signInAuthState';

jest.mock('@proton/shared/lib/keys', () => ({
    ...jest.requireActual('@proton/shared/lib/keys'),
    getRequiresPasswordSetup: jest.fn(() => false),
}));

const form: CredentialsFormValues = {
    username: 'user@example.com',
    password: 'secret',
    persistent: false,
    payload: { challenge: 'result' },
};
const usernameForm: UsernameFormValues = { username: form.username, persistent: false };
const session = { data: { User: { Flags: {} } } } as unknown as AuthSession;
const primaryAuth = { authType: AuthType.Srp, username: 'user@example.com' } as unknown as PrimaryAuthResult;

interface AuthOptions {
    sso?: { step: SSOLoginCapabilites; capabilities?: SSOLoginCapabilites[]; backupPasswordDisabled?: boolean };
    twoFactor?: boolean;
    secondPassword?: boolean;
    keys?: number;
    temporaryPassword?: boolean;
    authType?: AuthType;
}

/** What `createAuthState` builds for an account like this. */
const makeCreatedAuth = ({
    sso,
    twoFactor = false,
    secondPassword = false,
    keys = 1,
    temporaryPassword = false,
    authType = AuthType.Srp,
}: AuthOptions = {}): CreatedAuth => ({
    auth: {
        credentials: {
            authType,
            username: 'member@example.com',
            loginPassword: 'secret',
            authResponse: {
                TemporaryPassword: temporaryPassword ? 1 : 0,
                SSOBackupPasswordDisabled: sso?.backupPasswordDisabled,
            },
        },
        account: { user: { Keys: new Array(keys).fill({}) } },
    } as unknown as SignInAuthState,
    authTypes: {
        twoFactor: { enabled: twoFactor, totp: twoFactor, fido2: false },
        unlock: secondPassword,
    },
});

/** What the SSO flow loads while preparing. */
const makeSSOData = (sso: NonNullable<AuthOptions['sso']>) =>
    ({
        type: 'unlock',
        intent: { step: sso.step, capabilities: new Set([sso.step, ...(sso.capabilities ?? [])]) },
        organizationData: { logo: { cleanup: jest.fn() } },
    }) as unknown as SSODataTypes;

const apiError = (code: number) => ({ data: { Code: code, Error: `error ${code}` } });
/** A promise the test settles by hand, to control when an actor finishes. */
const deferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

interface Overrides {
    /** The lost-2FA flow with its verifications' requests; without it they aren't provided. */
    lostTwoFactorFlow?: typeof lost2FAStateMachine;
    prepareSignIn?: () => Promise<void>;
    startAuthSession?: () => Promise<void>;
    fetchAccountType?: () => Promise<AccountType>;
    fetchSSOInfo?: () => Promise<SSOInfoResponse>;
    authenticateWithPassword?: (values: CredentialsFormValues) => Promise<PrimaryAuthResult>;
    authorizeWithSSOProvider?: () => Promise<SSOProviderResult>;
    authenticateWithSSOToken?: (input: unknown) => Promise<PrimaryAuthResult>;
    created?: CreatedAuth;
    /** What the SSO flow's preparation returns, unless `prepareSSO` is overridden. */
    ssoData?: SSODataTypes;
    verifyTwoFactor?: (input: unknown) => Promise<void>;
    prepareSSO?: () => Promise<PrepareSSOResult>;
    unlockKeys?: () => Promise<AuthSession>;
    confirmSSODevice?: () => Promise<SSOSignInResult>;
    requestAdminApproval?: () => Promise<void>;
    unlockWithBackupPassword?: () => Promise<SSOSignInResult>;
    setupSSOKeys?: () => Promise<AuthSession>;
    completeSignIn?: () => Promise<void>;
}

function startActor(overrides: Overrides = {}, input: Partial<SignInMachineInput> = {}) {
    const created = overrides.created ?? makeCreatedAuth();
    const { auth } = created;
    const { ssoData } = overrides;
    const spies = {
        completeSignIn: jest.fn(overrides.completeSignIn ?? (() => Promise.resolve())),
        prepareSignIn: jest.fn(overrides.prepareSignIn ?? (() => Promise.resolve())),
        startAuthSession: jest.fn(overrides.startAuthSession ?? (() => Promise.resolve())),
        authenticateWithPassword: jest.fn(
            overrides.authenticateWithPassword ?? ((_values: CredentialsFormValues) => Promise.resolve(primaryAuth))
        ),
        navigateBack: jest.fn(),
        redirectToAccountSSO: jest.fn(),
        verifyTwoFactor: jest.fn(overrides.verifyTwoFactor ?? ((_input: unknown) => Promise.resolve())),
        goToResetPassword: jest.fn(),
        finalize: jest.fn(() => Promise.resolve(session)),
        setupPassword: jest.fn(() => Promise.resolve(session)),
        unlockKeys: jest.fn(overrides.unlockKeys ?? (() => Promise.resolve(session))),
        setupSSOKeys: jest.fn((_input: unknown) => (overrides.setupSSOKeys ?? (() => Promise.resolve(session)))()),
        changeBackupPassword: jest.fn((_input: unknown) => Promise.resolve(session)),
        unlockWithBackupPassword: jest.fn(
            overrides.unlockWithBackupPassword ?? (() => Promise.resolve<SSOSignInResult>({ type: 'session', session }))
        ),
        authenticateWithSSOToken: jest.fn(
            overrides.authenticateWithSSOToken ?? ((_input: unknown) => Promise.resolve(primaryAuth))
        ),
    };
    // The account comes from the fixture; loading it adds the salts.
    const loadedAccount = { user: auth.account.user as User, salts: [] as KeySalt[] };
    const passwordPolicies = [{ PolicyName: 'length' }] as unknown as OrganizationData['passwordPolicies'];
    /** Each device-approval poll the machine starts; the test answers through `sendBack`. */
    const polls: { sendBack: (event: SSODeviceEvent) => void; stopped: boolean }[] = [];
    const machine = SignInStateMachine.provide({
        actors: {
            prepareSignIn: fromPromise(() => spies.prepareSignIn()),
            createAuthState: fromPromise(() => Promise.resolve(created)),
            credentialsFlow: credentialsStateMachine.provide({
                actors: {
                    startAuthSession: fromPromise(() => spies.startAuthSession()),
                    fetchAccountType: fromPromise(
                        overrides.fetchAccountType ?? (() => Promise.resolve<AccountType>({ type: 'srp' }))
                    ),
                    fetchSSOInfo: fromPromise(
                        overrides.fetchSSOInfo ??
                            (() => Promise.resolve({ SSOChallengeToken: 'challenge' } as SSOInfoResponse))
                    ),
                    authenticateWithPassword: fromPromise(({ input }) => spies.authenticateWithPassword(input)),
                    authorizeWithSSOProvider: fromPromise(
                        overrides.authorizeWithSSOProvider ?? (() => Promise.resolve({ uid: 'uid', token: 'token' }))
                    ),
                    authenticateWithSSOToken: fromPromise(({ input }) => spies.authenticateWithSSOToken(input)),
                },
                actions: {
                    navigateBack: spies.navigateBack,
                    redirectToAccountSSO: (_, params) => spies.redirectToAccountSSO(params),
                },
            }),
            passwordAccountFlow: passwordAccountStateMachine.provide({
                actors: {
                    verifyTwoFactor: fromPromise(({ input }) => spies.verifyTwoFactor(input)),
                    loadAccount: fromPromise(() => Promise.resolve(loadedAccount)),
                    loadPasswordPolicies: fromPromise(() => Promise.resolve(passwordPolicies)),
                    setupPassword: fromPromise(() => spies.setupPassword()),
                    finalize: fromPromise(() => spies.finalize()),
                    unlockKeys: fromPromise(() => spies.unlockKeys()),
                    completeSignIn: fromPromise(() => spies.completeSignIn()),
                    // The flow checks backup codes as the second factor, like `verifyTwoFactor`
                    lostTwoFactorFlow:
                        overrides.lostTwoFactorFlow ??
                        lost2FAStateMachine.provide({
                            actors: {
                                verifyBackupCode: fromPromise(({ input }) =>
                                    spies.verifyTwoFactor({ credentials: { type: 'code', payload: input.code } })
                                ),
                            },
                        }),
                },
                actions: {
                    goToResetPassword: (_, params) => spies.goToResetPassword(params),
                },
            }),
            ssoFlow: ssoStateMachine.provide({
                actors: {
                    loadAccount: fromPromise(() => Promise.resolve(loadedAccount)),
                    prepareSSO: fromPromise(
                        overrides.prepareSSO ??
                            (() =>
                                Promise.resolve<PrepareSSOResult>({
                                    type: 'sso',
                                    ssoData: ssoData as SSODataTypes,
                                }))
                    ),
                    completeSignIn: fromPromise(() => spies.completeSignIn()),
                    waitForDeviceApproval: fromCallback<SSODeviceEvent, { auth: SignInAuthState }>(({ sendBack }) => {
                        const poll = { sendBack, stopped: false };
                        polls.push(poll);
                        return () => {
                            poll.stopped = true;
                        };
                    }),
                    confirmSSODevice: fromPromise(
                        overrides.confirmSSODevice ??
                            (() => Promise.resolve<SSOSignInResult>({ type: 'session', session }))
                    ),
                    requestAdminApproval: fromPromise(overrides.requestAdminApproval ?? (() => Promise.resolve())),
                    unlockWithBackupPassword: fromPromise(() => spies.unlockWithBackupPassword()),
                    setupSSOKeys: fromPromise(({ input }) => spies.setupSSOKeys(input)),
                    changeBackupPassword: fromPromise(({ input }) => spies.changeBackupPassword(input)),
                },
            }),
        },
    });
    const actor = createActor(machine, {
        input: {
            username: 'initial@example.com',
            authTypeData: { type: AuthType.Srp },
            canNavigateBack: false,
            setupVPN: false,
            redirectsSSOToAccount: false,
            externalSSO: undefined,
            showSSONotice: false,
            ...input,
        },
    });
    const emitted: SignInMachineEmitted[] = [];
    actor.on('*', (event) => emitted.push(event));
    // The credentials step emits the SSO notice for its screen. Its actor exists before the sign-in starts, as
    // `CredentialsStep` relies on to subscribe in time for the notice at page load.
    const noticeEvents: unknown[] = [];
    actor.getSnapshot().children.credentials?.on('notice.ssoRequired', (event) => noticeEvents.push(event));
    actor.start();
    const errors = () => emitted.flatMap((event) => (event.type === 'error' ? [event.error] : []));
    const notices = () => noticeEvents;
    return { actor, spies, errors, notices, polls, auth, ssoData };
}

type Actor = ReturnType<typeof startActor>['actor'];

/** The credentials step, which the sign-in runs as a child for the whole page. */
const credentialsFlow = (actor: Actor) => {
    const child = actor.getSnapshot().children.credentials;
    if (!child) {
        throw new Error('The credentials step is not running');
    }
    return child;
};

/** The account flow the sign-in runs as a child after the first authentication, if any. */
const accountFlow = (actor: Actor) => actor.getSnapshot().children.passwordAccount ?? actor.getSnapshot().children.sso;

/** The password account flow; the tests below only call it while it runs. */
const passwordAccount = (actor: Actor) => {
    const child = actor.getSnapshot().children.passwordAccount;
    if (!child) {
        throw new Error('The password account flow is not running');
    }
    return child;
};

/** Polls until the condition holds: child actors don't always change the sign-in's snapshot. */
const waitUntil = async (condition: () => boolean, timeout = 1_000) => {
    const start = Date.now();
    while (!condition()) {
        if (Date.now() - start > timeout) {
            throw new Error('Timed out');
        }
        await new Promise((resolve) => setTimeout(resolve, 1));
    }
};

/** Nothing runs: the credentials form or an account flow's screen waits for the user, or the sign-in is done. */
const waitUntilSettled = async (actor: Actor) => {
    await waitUntil(() => {
        const snap = actor.getSnapshot();
        if (snap.status !== 'active') {
            return true;
        }
        const flow = accountFlow(actor)?.getSnapshot();
        if (flow) {
            // The lost-2FA flow checks its codes itself, and stays up loading while a backup code signs in
            const lost2FA = actor
                .getSnapshot()
                .children.passwordAccount?.getSnapshot()
                .children.lostTwoFactor?.getSnapshot();
            return flow.context.screen !== undefined && !flow.hasTag('submitting') && !lost2FA?.hasTag('submitting');
        }
        return !snap.matches('authenticated') && !credentialsFlow(actor).getSnapshot().hasTag('submitting');
    });
    return actor.getSnapshot();
};

const submitCredentials = (actor: Actor, values: CredentialsFormValues = form) => {
    credentialsFlow(actor).send({ type: 'credentials.submitted', payload: values });
    return waitUntilSettled(actor);
};

/** The username step (auto) and the SSO form. */
const submitUsername = (actor: Actor) => {
    credentialsFlow(actor).send({ type: 'credentials.usernameSubmitted', payload: usernameForm });
    return waitUntilSettled(actor);
};

const startWith = (authTypeData: AuthTypeData, overrides: Overrides = {}, input: Partial<SignInMachineInput> = {}) =>
    startActor(overrides, { authTypeData, ...input });

describe('SignInStateMachine', () => {
    describe('credentials', () => {
        it.each([
            [{ type: AuthType.Srp }, 'srp'],
            [{ type: AuthType.Auto }, 'auto'],
            [{ type: AuthType.ExternalSSO }, 'externalSSO'],
        ] as const)('starts on the form for %o', (authTypeData, mode) => {
            const { actor } = startWith(authTypeData);
            expect(credentialsFlow(actor).getSnapshot().matches({ form: mode })).toBe(true);
            expect(actor.getSnapshot().context.step).toBe('credentials');
        });

        it('signs in with a password and completes in one-password mode', async () => {
            const { actor, spies } = startActor();
            const snap = await submitCredentials(actor);
            expect(snap.status).toBe('done');
            expect(spies.unlockKeys).toHaveBeenCalledTimes(1);
            expect(spies.completeSignIn).toHaveBeenCalledTimes(1);
        });

        it('is submitting and keeps the credentials step while working', async () => {
            const pending = deferred<void>();
            const { actor } = startActor({ completeSignIn: () => pending.promise });
            credentialsFlow(actor).send({ type: 'credentials.submitted', payload: form });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'signingIn' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().hasTag('submitting')).toBe(true);
            // One-password mode: the flow completes without a screen of its own, so the form stays up
            await waitUntil(() => !!accountFlow(actor)?.getSnapshot().matches('completing'));
            expect(actor.getSnapshot().context.step).toBe('credentials');
            // The form waits in `submitted`, still loading
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'submitted' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().hasTag('submitting')).toBe(true);
            pending.resolve();
            await waitUntilSettled(actor);
        });

        it('shows a wrong password inline and clears it on edit', async () => {
            const { actor, errors } = startActor({
                authenticateWithPassword: () => Promise.reject(apiError(API_CUSTOM_ERROR_CODES.INVALID_LOGIN)),
            });
            await submitCredentials(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().context.errorMessage).toBe(
                `error ${API_CUSTOM_ERROR_CODES.INVALID_LOGIN}`
            );
            expect(errors()).toEqual([]);
            credentialsFlow(actor).send({ type: 'credentials.edited' });
            expect(credentialsFlow(actor).getSnapshot().context.errorMessage).toBeUndefined();
        });

        it('switches to the SSO form when the account uses SSO', async () => {
            const { actor, notices } = startActor({
                authenticateWithPassword: () => Promise.reject(apiError(API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO)),
            });
            await submitCredentials(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { externalSSO: 'idle' } })
            ).toBe(true);
            expect(selectAuthType(credentialsFlow(actor).getSnapshot())).toBe(AuthType.ExternalSSO);
            expect(notices()).toHaveLength(1);
        });

        it('sends SSO accounts of other apps to account', async () => {
            const { actor, spies } = startActor(
                { authenticateWithPassword: () => Promise.reject(apiError(API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO)) },
                { redirectsSSOToAccount: true }
            );
            await submitCredentials(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(spies.redirectToAccountSSO).toHaveBeenCalledWith({ username: form.username });
        });

        it('reports other errors and stays on the form', async () => {
            const error = new Error('boom');
            const { actor, errors } = startActor({ authenticateWithPassword: () => Promise.reject(error) });
            await submitCredentials(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(errors()).toEqual([error]);
        });

        it('keeps the password only in the login request, not in the step', async () => {
            const login = deferred<PrimaryAuthResult>();
            const { actor } = startActor({ authenticateWithPassword: () => login.promise });
            credentialsFlow(actor).send({ type: 'credentials.submitted', payload: form });
            await waitUntil(() =>
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'signingIn' } })
            );
            expect(JSON.stringify(credentialsFlow(actor).getSnapshot().context)).not.toContain(form.password);
            login.resolve(primaryAuth);
            // Waiting for the account flow in `submitted`, and after a wrong password
            await waitUntil(() =>
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'submitted' } })
            );
            expect(JSON.stringify(credentialsFlow(actor).getSnapshot().context)).not.toContain(form.password);
        });

        it('restarts the credentials step on the form when it crashes, and reports the error', async () => {
            const error = new Error('crash');
            const { actor, spies, errors } = startActor(
                { authenticateWithPassword: () => Promise.reject(apiError(API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO)) },
                { redirectsSSOToAccount: true }
            );
            spies.redirectToAccountSSO.mockImplementation(() => {
                throw error;
            });
            const crashed = credentialsFlow(actor);
            await submitCredentials(actor);
            expect(errors()).toEqual([error]);
            expect(actor.getSnapshot().status).toBe('active');
            expect(credentialsFlow(actor)).not.toBe(crashed);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            // The new step works: a sign-in goes through it
            spies.redirectToAccountSSO.mockReset();
            credentialsFlow(actor).send({ type: 'credentials.submitted', payload: form });
            await waitUntil(() => spies.authenticateWithPassword.mock.calls.length === 2);
        });

        it('navigates back only when the page allows it', () => {
            const withoutBack = startActor();
            credentialsFlow(withoutBack.actor).send({ type: 'decision.back' });
            expect(withoutBack.spies.navigateBack).not.toHaveBeenCalled();

            const withBack = startActor({}, { canNavigateBack: true });
            credentialsFlow(withBack.actor).send({ type: 'decision.back' });
            expect(withBack.spies.navigateBack).toHaveBeenCalledTimes(1);
        });

        it('ignores back while a request runs', async () => {
            const { actor, spies } = startActor(
                { authenticateWithPassword: () => new Promise(() => {}) },
                { canNavigateBack: true }
            );
            credentialsFlow(actor).send({ type: 'credentials.submitted', payload: form });
            credentialsFlow(actor).send({ type: 'decision.back' });
            expect(spies.navigateBack).not.toHaveBeenCalled();
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'signingIn' } })
            ).toBe(true);
        });

        it('emits the SSO notice on start when asked to', () => {
            const { notices } = startWith({ type: AuthType.ExternalSSO }, {}, { showSSONotice: true });
            expect(notices()).toHaveLength(1);
        });
    });

    describe('preparation', () => {
        it('starts preparing as soon as the flow starts', () => {
            const { spies } = startActor();
            expect(spies.prepareSignIn).toHaveBeenCalledTimes(1);
        });

        it('starts the auth session whenever the credentials step opens', async () => {
            const { actor, spies } = startActor({
                created: makeCreatedAuth({ twoFactor: true }),
                startAuthSession: () => Promise.reject(new Error('offline')),
            });
            expect(spies.startAuthSession).toHaveBeenCalledTimes(1);
            await submitCredentials(actor);
            // Still once: the form stays open until the account flow shows its first screen
            expect(spies.startAuthSession).toHaveBeenCalledTimes(1);
            // Back from the 2FA screen ends the password account flow and reopens the form
            passwordAccount(actor).send({ type: 'decision.back' });
            expect(spies.startAuthSession).toHaveBeenCalledTimes(2);
        });

        it('does not block sign-in when preparation fails', async () => {
            const { actor, errors } = startActor({ prepareSignIn: () => Promise.reject(new Error('offline')) });
            expect((await submitCredentials(actor)).status).toBe('done');
            expect(errors()).toEqual([]);
        });
    });

    describe('challenge', () => {
        it('sends the submitted challenge result with the password login', async () => {
            const { actor, spies } = startActor();
            await submitCredentials(actor);
            expect(spies.authenticateWithPassword).toHaveBeenCalledWith(form);
        });
    });

    describe('auto', () => {
        it('asks for the password when the account uses one, and goes back to the username', async () => {
            const { actor } = startWith({ type: AuthType.Auto });
            await submitUsername(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { autoSrp: 'idle' } })
            ).toBe(true);
            expect(selectAuthType(credentialsFlow(actor).getSnapshot())).toBe(AuthType.AutoSrp);
            expect(credentialsFlow(actor).getSnapshot().context.username).toBe(form.username);
            credentialsFlow(actor).send({ type: 'decision.back' });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { auto: 'idle' } })
            ).toBe(true);
            expect(selectAuthType(credentialsFlow(actor).getSnapshot())).toBe(AuthType.Auto);
        });

        it('goes back to the username while the password is checked, dropping that attempt', async () => {
            const login = deferred<PrimaryAuthResult>();
            const { actor, spies } = startWith(
                { type: AuthType.Auto },
                { authenticateWithPassword: () => login.promise }
            );
            await submitUsername(actor);
            credentialsFlow(actor).send({ type: 'credentials.submitted', payload: form });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { autoSrp: 'signingIn' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().can({ type: 'decision.back' })).toBe(true);
            credentialsFlow(actor).send({ type: 'decision.back' });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { auto: 'idle' } })
            ).toBe(true);
            // The login finishing late must not sign in
            login.resolve(primaryAuth);
            await Promise.resolve();
            expect(actor.getSnapshot().matches('awaitingCredentials')).toBe(true);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { auto: 'idle' } })
            ).toBe(true);
            expect(spies.completeSignIn).not.toHaveBeenCalled();
        });

        it('no longer goes back once the password is accepted, since the sign-in may leave the page', async () => {
            const { actor } = startWith({ type: AuthType.Auto }, { completeSignIn: () => new Promise<void>(() => {}) });
            await submitUsername(actor);
            credentialsFlow(actor).send({ type: 'credentials.submitted', payload: form });
            await waitUntil(() => !!accountFlow(actor)?.getSnapshot().matches('completing'));
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { autoSrp: 'submitted' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().can({ type: 'decision.back' })).toBe(false);
            credentialsFlow(actor).send({ type: 'decision.back' });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { autoSrp: 'submitted' } })
            ).toBe(true);
        });

        it('keeps the page back waiting for the password login, like main', async () => {
            const { actor, spies } = startWith(
                { type: AuthType.Srp },
                { authenticateWithPassword: () => new Promise<PrimaryAuthResult>(() => {}) },
                { canNavigateBack: true }
            );
            credentialsFlow(actor).send({ type: 'credentials.submitted', payload: form });
            credentialsFlow(actor).send({ type: 'decision.back' });
            expect(spies.navigateBack).not.toHaveBeenCalled();
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'signingIn' } })
            ).toBe(true);
        });

        it('opens the SSO provider when the account uses SSO, keeping the auto form', async () => {
            const provider = deferred<SSOProviderResult>();
            const { actor, spies } = startWith(
                { type: AuthType.Auto },
                {
                    fetchAccountType: () =>
                        Promise.resolve<AccountType>({
                            type: 'sso',
                            ssoInfo: { SSOChallengeToken: 'challenge' } as SSOInfoResponse,
                        }),
                    authorizeWithSSOProvider: () => provider.promise,
                }
            );
            credentialsFlow(actor).send({ type: 'credentials.usernameSubmitted', payload: usernameForm });
            await waitFor(credentialsFlow(actor), (snap) => snap.hasTag('awaitingProvider'), {
                timeout: 1_000,
            });
            expect(selectAuthType(credentialsFlow(actor).getSnapshot())).toBe(AuthType.Auto);
            provider.resolve({ uid: 'uid', token: 'token' });
            await waitUntilSettled(actor);
            expect(spies.authenticateWithSSOToken).toHaveBeenCalledWith(
                expect.objectContaining({ uid: 'uid', token: 'token', username: form.username })
            );
        });

        it('goes back to the auto form when the SSO provider window is cancelled', async () => {
            const { actor, errors } = startWith(
                { type: AuthType.Auto },
                {
                    fetchAccountType: () =>
                        Promise.resolve<AccountType>({
                            type: 'sso',
                            ssoInfo: { SSOChallengeToken: 'challenge' } as SSOInfoResponse,
                        }),
                    authorizeWithSSOProvider: () => new Promise(() => {}),
                }
            );
            credentialsFlow(actor).send({ type: 'credentials.usernameSubmitted', payload: usernameForm });
            await waitFor(credentialsFlow(actor), (snap) => snap.hasTag('awaitingProvider'), {
                timeout: 1_000,
            });
            credentialsFlow(actor).send({ type: 'externalSSO.cancelled' });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { auto: 'idle' } })
            ).toBe(true);
            expect(errors()).toEqual([]);
        });

        it('sends SSO accounts of other apps to account from the username step', async () => {
            const { actor, spies, errors } = startWith(
                { type: AuthType.Auto },
                { fetchAccountType: () => Promise.reject(apiError(API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO)) },
                { redirectsSSOToAccount: true }
            );
            await submitUsername(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { auto: 'idle' } })
            ).toBe(true);
            expect(spies.redirectToAccountSSO).toHaveBeenCalledWith({ username: usernameForm.username });
            expect(errors()).toEqual([]);
        });
    });

    describe('external SSO', () => {
        it('does not report a closed provider window', async () => {
            const { actor, errors } = startWith(
                { type: AuthType.ExternalSSO },
                { authorizeWithSSOProvider: () => Promise.reject(new ExternalSSOError('closed')) }
            );
            await submitUsername(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { externalSSO: 'idle' } })
            ).toBe(true);
            expect(errors()).toEqual([]);
        });

        it('falls back to the password form when the account has no SSO', async () => {
            const error = apiError(API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SRP);
            const { actor, errors } = startWith(
                { type: AuthType.ExternalSSO },
                { fetchSSOInfo: () => Promise.reject(error) }
            );
            await submitUsername(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(errors()).toEqual([error]);
        });

        it('switches to the password form on request', () => {
            const { actor } = startWith({ type: AuthType.ExternalSSO });
            credentialsFlow(actor).send({
                type: 'credentials.passwordSignInRequested',
                payload: { username: 'typed@example.com' },
            });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().context.username).toBe('typed@example.com');
        });

        it('exchanges the token from the identity provider redirect once, on its own', async () => {
            const { actor, spies } = startWith(
                { type: AuthType.ExternalSSO },
                { authenticateWithSSOToken: () => Promise.reject(new Error('used')) },
                { externalSSO: { token: 'redirect-token', persistent: true } }
            );
            await waitUntilSettled(actor);
            expect(spies.authenticateWithSSOToken).toHaveBeenCalledWith(
                expect.objectContaining({ uid: undefined, token: 'redirect-token', persistent: true })
            );
            // Back on the SSO form after the failure; the used token isn't tried again
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { externalSSO: 'idle' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().context.externalSSO).toBeUndefined();
            expect(spies.authenticateWithSSOToken).toHaveBeenCalledTimes(1);
        });
    });

    describe('two-factor', () => {
        const startOnTwoFactor = async (overrides: Overrides = {}) => {
            const started = startActor({ created: makeCreatedAuth({ twoFactor: true }), ...overrides });
            await submitCredentials(started.actor);
            return started;
        };

        it('asks for the second factor, then completes', async () => {
            const { actor, spies } = await startOnTwoFactor();
            expect(passwordAccount(actor).getSnapshot().matches({ twoFactor: 'idle' })).toBe(true);
            expect(actor.getSnapshot().context.step).toBe('passwordAccount');
            passwordAccount(actor).send({
                type: 'twoFactor.submitted',
                payload: { credentials: { type: 'code', payload: '123456' } },
            });
            expect((await waitUntilSettled(actor)).status).toBe('done');
            expect(spies.completeSignIn).toHaveBeenCalledTimes(1);
        });

        it('shows the account flow step once, and leaves it as the flow goes on', async () => {
            const { actor } = await startOnTwoFactor();
            expect(actor.getSnapshot().context.step).toBe('passwordAccount');
            const signIn = actor.getSnapshot();
            const flow = passwordAccount(actor).getSnapshot();

            passwordAccount(actor).send({ type: 'twoFactor.codeEdited' });
            // Compared by identity as booleans: a failing matcher on a snapshot overflows the serializer
            expect(passwordAccount(actor).getSnapshot() === flow).toBe(false);
            expect(actor.getSnapshot() === signIn).toBe(true);
        });

        it('shows a wrong code in the form, like the backup code screen, without reporting it', async () => {
            const { actor, errors } = await startOnTwoFactor({
                verifyTwoFactor: () => Promise.reject(new TOTPError('Incorrect code')),
            });
            passwordAccount(actor).send({
                type: 'twoFactor.submitted',
                payload: { credentials: { type: 'code', payload: '000000' } },
            });
            await waitUntilSettled(actor);
            expect(passwordAccount(actor).getSnapshot().matches({ twoFactor: 'idle' })).toBe(true);
            expect(passwordAccount(actor).getSnapshot().context.twoFactorError).toBe('Incorrect code');
            expect(errors()).toEqual([]);

            // Typing a new code clears it
            passwordAccount(actor).send({ type: 'twoFactor.codeEdited' });
            expect(passwordAccount(actor).getSnapshot().context.twoFactorError).toBeUndefined();

            // The next attempt starts without it
            passwordAccount(actor).send({
                type: 'twoFactor.submitted',
                payload: { credentials: { type: 'code', payload: '123456' } },
            });
            expect(passwordAccount(actor).getSnapshot().context.twoFactorError).toBeUndefined();
        });

        it('reopens the credentials form with the submitted username on other errors', async () => {
            const { actor } = await startOnTwoFactor({ verifyTwoFactor: () => Promise.reject(new Error('boom')) });
            passwordAccount(actor).send({
                type: 'twoFactor.submitted',
                payload: { credentials: { type: 'code', payload: '000000' } },
            });
            await waitUntilSettled(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            // The reopened form keeps what was submitted
            expect(credentialsFlow(actor).getSnapshot().context.username).toBe(form.username);
        });

        it('drops a result that arrives after going back', async () => {
            const pending = deferred<void>();
            const { actor, spies } = await startOnTwoFactor({ verifyTwoFactor: () => pending.promise });
            passwordAccount(actor).send({
                type: 'twoFactor.submitted',
                payload: { credentials: { type: 'code', payload: '123456' } },
            });
            passwordAccount(actor).send({ type: 'decision.back' });
            pending.resolve();
            await pending.promise;
            await Promise.resolve();
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(spies.completeSignIn).not.toHaveBeenCalled();
        });

        it('opens the lost two-factor flow while a code is checked, like main', async () => {
            const pending = deferred<void>();
            const { actor } = await startOnTwoFactor({ verifyTwoFactor: () => pending.promise });
            passwordAccount(actor).send({
                type: 'twoFactor.submitted',
                payload: { credentials: { type: 'code', payload: '123456' } },
            });
            expect(passwordAccount(actor).getSnapshot().matches({ twoFactor: 'submitting' })).toBe(true);
            passwordAccount(actor).send({ type: 'lostTwoFactor.opened' });
            expect(passwordAccount(actor).getSnapshot().matches('lostTwoFactor')).toBe(true);
            // The verification was left behind; its late result is ignored
            pending.resolve();
            await Promise.resolve();
            expect(passwordAccount(actor).getSnapshot().matches('lostTwoFactor')).toBe(true);
        });
    });

    describe('lost two-factor', () => {
        const startOnLostTwoFactor = async (overrides: Overrides = {}) => {
            const started = startActor({ created: makeCreatedAuth({ twoFactor: true }), ...overrides });
            await submitCredentials(started.actor);
            passwordAccount(started.actor).send({ type: 'lostTwoFactor.opened' });
            const flow = passwordAccount(started.actor).getSnapshot().children.lostTwoFactor!;
            return { ...started, flow };
        };

        it('runs the lost-2FA flow as a child, starting on the backup code', async () => {
            const { flow } = await startOnLostTwoFactor();
            expect(flow.getSnapshot().matches('requestBackupCode')).toBe(true);
        });

        it('verifies the backup code sent by the flow and signs in', async () => {
            const { actor, flow, spies } = await startOnLostTwoFactor();
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'backup' });
            const snap = await waitUntilSettled(actor);
            expect(spies.verifyTwoFactor).toHaveBeenCalledWith(
                expect.objectContaining({ credentials: { type: 'code', payload: 'backup' } })
            );
            expect(snap.status).toBe('done');
        });

        it('keeps the flow on its loading backup code form until the sign-in completes, like main', async () => {
            const signIn = deferred<void>();
            const { actor, flow } = await startOnLostTwoFactor({ completeSignIn: () => signIn.promise });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'backup' });
            await waitUntil(() => passwordAccount(actor).getSnapshot().matches('completing'));
            const snapshot = passwordAccount(actor).getSnapshot();
            expect(snapshot.context.screen).toBe('lostTwoFactor');
            // Compared by session: a failing match on the actors themselves overflows Jest's serializer
            expect(snapshot.children.lostTwoFactor?.sessionId).toBe(flow.sessionId);
            expect(flow.getSnapshot().matches({ requestBackupCode: 'accepted' })).toBe(true);
            expect(flow.getSnapshot().hasTag('submitting')).toBe(true);
            signIn.resolve();
            expect((await waitUntilSettled(actor)).status).toBe('done');
        });

        it('stops the flow once the account needs its second password', async () => {
            const { actor, flow } = await startOnLostTwoFactor({
                created: makeCreatedAuth({ twoFactor: true, secondPassword: true }),
            });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'backup' });
            await waitUntil(() => passwordAccount(actor).getSnapshot().matches('unlock'));
            expect(passwordAccount(actor).getSnapshot().context.screen).toBe('unlock');
            expect(passwordAccount(actor).getSnapshot().children.lostTwoFactor?.sessionId).toBeUndefined();
            expect(flow.getSnapshot().status).toBe('stopped');
        });

        it('starts a new flow when reopened from the two-factor step', async () => {
            const { actor, flow } = await startOnLostTwoFactor();
            flow.send({ type: 'decision.back' });
            expect(passwordAccount(actor).getSnapshot().children.lostTwoFactor?.sessionId).toBeUndefined();
            passwordAccount(actor).send({ type: 'lostTwoFactor.opened' });
            const reopened = passwordAccount(actor).getSnapshot().children.lostTwoFactor;
            expect(reopened?.sessionId).toBeDefined();
            expect(reopened?.sessionId).not.toBe(flow.sessionId);
            expect(reopened!.getSnapshot().matches('requestBackupCode')).toBe(true);
        });

        it('shows a wrong backup code inline in the flow, without reporting it', async () => {
            const { actor, flow, errors } = await startOnLostTwoFactor({
                verifyTwoFactor: () => Promise.reject(new TOTPError('Too many attempts')),
            });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'wrong' });
            await waitUntilSettled(actor);
            expect(passwordAccount(actor).getSnapshot().matches('lostTwoFactor')).toBe(true);
            expect(flow.getSnapshot().matches({ requestBackupCode: 'idle' })).toBe(true);
            expect(flow.getSnapshot().context.backupCodeError).toBe('Too many attempts');
            expect(errors()).toEqual([]);
        });

        it('shows a generic message for a wrong backup code without a message of its own', async () => {
            const { actor, flow } = await startOnLostTwoFactor({
                verifyTwoFactor: () => Promise.reject(new TOTPError('')),
            });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'wrong' });
            await waitUntilSettled(actor);
            expect(flow.getSnapshot().context.backupCodeError).toBe('Incorrect recovery code. Please try again.');
        });

        it("shows a verification's error through the sign-in", async () => {
            const error = new Error('wrong phrase');
            const created = makeCreatedAuth({ twoFactor: true });
            Object.assign(created.auth.credentials.authResponse, { HasRecoveryPhrase: 1 });
            const { flow, errors } = await startOnLostTwoFactor({
                created,
                lostTwoFactorFlow: lost2FAStateMachine.provide({
                    actors: {
                        verifyPhraseAndDisable2FA: fromPromise(() => Promise.reject(error)),
                    },
                }),
            });
            flow.send({ type: 'lost2FA.otherMethodRequested' });
            expect(flow.getSnapshot().matches('verifyOwnershipWithPhrase')).toBe(true);
            flow.send({ type: 'verification.phraseSubmitted', phrase: 'wrong' });
            await waitUntil(() => errors().length > 0);
            expect(errors()).toEqual([error]);
        });

        it('clears a rejected backup code once the user edits it', async () => {
            const { actor, flow } = await startOnLostTwoFactor({
                verifyTwoFactor: () => Promise.reject(new TOTPError('Incorrect code')),
            });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'wrong' });
            await waitUntilSettled(actor);
            expect(flow.getSnapshot().context.backupCodeError).toBe('Incorrect code');
            flow.send({ type: 'lost2FA.backupCode.edited' });
            expect(flow.getSnapshot().context.backupCodeError).toBeUndefined();
        });

        it('clears a rejected backup code when coming back to it', async () => {
            const { actor, flow } = await startOnLostTwoFactor({
                verifyTwoFactor: () => Promise.reject(new TOTPError('Incorrect code')),
            });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'wrong' });
            await waitUntilSettled(actor);
            expect(flow.getSnapshot().context.backupCodeError).toBe('Incorrect code');
            // No recovery method in the test account: the other way is the reset screen
            flow.send({ type: 'lost2FA.otherMethodRequested' });
            flow.send({ type: 'decision.back' });
            expect(flow.getSnapshot().matches({ requestBackupCode: 'idle' })).toBe(true);
            expect(flow.getSnapshot().context.backupCodeError).toBeUndefined();
        });

        it('goes back to the credentials form with the error when the lost-2FA flow crashes', async () => {
            const error = new Error('crash');
            const crashing = setup({}).createMachine({
                entry: () => {
                    throw error;
                },
            }) as unknown as typeof lost2FAStateMachine;
            const { actor, errors } = startActor({
                created: makeCreatedAuth({ twoFactor: true }),
                lostTwoFactorFlow: crashing,
            });
            await submitCredentials(actor);
            passwordAccount(actor).send({ type: 'lostTwoFactor.opened' });
            await waitUntil(() => actor.getSnapshot().matches('awaitingCredentials'));
            expect(errors()).toEqual([error]);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
        });

        it('goes back to the credentials form with the error when the account flow crashes', async () => {
            const error = new Error('crash');
            const { actor, flow, spies, errors } = await startOnLostTwoFactor();
            spies.goToResetPassword.mockImplementation(() => {
                throw error;
            });
            flow.send({ type: 'lost2FA.otherMethodRequested' });
            flow.send({ type: 'lost2FA.passwordResetRequested' });
            await waitUntil(() => actor.getSnapshot().matches('awaitingCredentials'));
            expect(actor.getSnapshot().status).toBe('active');
            expect(errors()).toEqual([error]);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
        });

        it('goes back to the credentials form on any other backup code error, like main', async () => {
            // Like the session the third wrong code revokes (a 401)
            const error = Object.assign(new Error('Incorrect code. Please try again.'), { status: 401 });
            const { actor, flow, errors } = await startOnLostTwoFactor({
                verifyTwoFactor: () => Promise.reject(error),
            });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'backup' });
            await waitUntil(() => actor.getSnapshot().matches('awaitingCredentials'));
            expect(errors()).toEqual([error]);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
        });

        it('ignores the ways out while the backup code is checked', async () => {
            const check = deferred<void>();
            const { actor, flow, spies } = await startOnLostTwoFactor({ verifyTwoFactor: () => check.promise });
            flow.send({ type: 'lost2FA.backupCode.submitted', code: 'backup' });
            // A valid code is used up on the server and signs in, which leaving would drop
            expect(flow.getSnapshot().can({ type: 'decision.back' })).toBe(false);
            expect(flow.getSnapshot().can({ type: 'lost2FA.otherMethodRequested' })).toBe(false);
            flow.send({ type: 'decision.back' });
            expect(flow.getSnapshot().matches({ requestBackupCode: 'submitting' })).toBe(true);
            expect(passwordAccount(actor).getSnapshot().matches('lostTwoFactor')).toBe(true);
            check.resolve();
            expect((await waitUntilSettled(actor)).status).toBe('done');
            expect(spies.completeSignIn).toHaveBeenCalledTimes(1);
        });

        it('goes back from a verification, and not while it checks', async () => {
            const check = deferred<void>();
            const created = makeCreatedAuth({ twoFactor: true });
            Object.assign(created.auth.credentials.authResponse, { HasRecoveryPhrase: 1 });
            const { flow } = await startOnLostTwoFactor({
                created,
                lostTwoFactorFlow: lost2FAStateMachine.provide({
                    actors: {
                        verifyPhraseAndDisable2FA: fromPromise(() => check.promise),
                    },
                }),
            });
            flow.send({ type: 'lost2FA.otherMethodRequested' });
            expect(flow.getSnapshot().matches('verifyOwnershipWithPhrase')).toBe(true);
            flow.send({ type: 'decision.back' });
            expect(flow.getSnapshot().matches('requestBackupCode')).toBe(true);

            flow.send({ type: 'lost2FA.otherMethodRequested' });
            flow.send({ type: 'verification.phraseSubmitted', phrase: 'my phrase' });
            // The flow ignores back while the phrase is checked: the server may disable two-factor authentication
            expect(flow.getSnapshot().can({ type: 'decision.back' })).toBe(false);
            flow.send({ type: 'decision.back' });
            expect(flow.getSnapshot().matches('verifyOwnershipWithPhrase')).toBe(true);
            check.resolve();
            await waitUntil(() => flow.getSnapshot().matches('twoFactorDisabled'));
        });

        it('goes back to the credentials form, with the username, once two-factor authentication is disabled', async () => {
            const created = makeCreatedAuth({ twoFactor: true });
            Object.assign(created.auth.credentials.authResponse, { HasRecoveryPhrase: 1 });
            const { actor, flow, spies, errors } = await startOnLostTwoFactor({
                created,
                lostTwoFactorFlow: lost2FAStateMachine.provide({
                    actors: { verifyPhraseAndDisable2FA: fromPromise(() => Promise.resolve()) },
                }),
            });
            flow.send({ type: 'lost2FA.otherMethodRequested' });
            flow.send({ type: 'verification.phraseSubmitted', phrase: 'my phrase' });
            await waitUntil(() => flow.getSnapshot().matches('twoFactorDisabled'));

            flow.send({ type: 'lost2FA.signInRequested' });
            expect(actor.getSnapshot().matches('awaitingCredentials')).toBe(true);
            expect(actor.getSnapshot().context.step).toBe('credentials');
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(credentialsFlow(actor).getSnapshot().context.username).toBe(form.username);
            // The next attempt gets a fresh auth session
            expect(spies.startAuthSession).toHaveBeenCalledTimes(2);
            expect(errors()).toEqual([]);
        });

        it('returns to the two-factor step when the flow goes back', async () => {
            const { actor, flow } = await startOnLostTwoFactor();
            flow.send({ type: 'decision.back' });
            expect(passwordAccount(actor).getSnapshot().matches('twoFactor')).toBe(true);
        });

        it('goes to the password reset when the flow ends there', async () => {
            const { flow, spies } = await startOnLostTwoFactor();
            // No recovery method in the test account: skipping the backup code leaves only the reset
            flow.send({ type: 'lost2FA.otherMethodRequested' });
            flow.send({ type: 'lost2FA.passwordResetRequested' });
            expect(spies.goToResetPassword).toHaveBeenCalledWith({ username: 'member@example.com' });
            expect(flow.getSnapshot().status).toBe('done');
        });
    });

    describe('account routing', () => {
        it('signs SSO accounts in directly when the device can unlock the keys', async () => {
            const { actor, spies } = startActor({
                created: makeCreatedAuth({ authType: AuthType.ExternalSSO }),
                prepareSSO: () => Promise.resolve({ type: 'session', session }),
            });
            expect((await submitCredentials(actor)).status).toBe('done');
            expect(spies.completeSignIn).toHaveBeenCalledTimes(1);
        });

        it('asks to replace a temporary password', async () => {
            const { actor, spies } = startActor({ created: makeCreatedAuth({ keys: 0, temporaryPassword: true }) });
            await submitCredentials(actor);
            const flow = passwordAccount(actor).getSnapshot();
            expect(flow.matches({ newPassword: 'idle' })).toBe(true);
            expect(flow.context.passwordPolicies).toEqual([{ PolicyName: 'length' }]);
            expect(flow.context.auth.account.salts).toEqual([]);
            passwordAccount(actor).send({ type: 'newPassword.submitted', payload: { password: 'new' } });
            expect((await waitUntilSettled(actor)).status).toBe('done');
            expect(spies.setupPassword).toHaveBeenCalledTimes(1);
        });

        it('creates keys with the sign-in password when the account needs them', async () => {
            jest.mocked(getRequiresPasswordSetup).mockReturnValueOnce(true);
            const { actor, spies } = startActor({ created: makeCreatedAuth({ keys: 0 }) });
            expect((await submitCredentials(actor)).status).toBe('done');
            expect(spies.setupPassword).toHaveBeenCalledTimes(1);
            expect(spies.finalize).not.toHaveBeenCalled();
        });

        it('finalizes accounts without keys', async () => {
            const { actor, spies } = startActor({ created: makeCreatedAuth({ keys: 0 }) });
            expect((await submitCredentials(actor)).status).toBe('done');
            expect(spies.finalize).toHaveBeenCalledTimes(1);
            expect(spies.unlockKeys).not.toHaveBeenCalled();
        });

        it('asks for the second password in two-password mode, and lets the user retry', async () => {
            let attempt = 0;
            const { actor, errors } = startActor({
                created: makeCreatedAuth({ secondPassword: true }),
                unlockKeys: () =>
                    attempt++ === 0 ? Promise.reject(new PasswordError('Wrong password')) : Promise.resolve(session),
            });
            await submitCredentials(actor);
            expect(passwordAccount(actor).getSnapshot().matches({ unlock: 'idle' })).toBe(true);
            passwordAccount(actor).send({ type: 'unlock.submitted', payload: { password: 'wrong' } });
            await waitUntilSettled(actor);
            expect(passwordAccount(actor).getSnapshot().matches({ unlock: 'idle' })).toBe(true);
            expect(errors()).toHaveLength(1);
            passwordAccount(actor).send({ type: 'unlock.submitted', payload: { password: 'right' } });
            expect((await waitUntilSettled(actor)).status).toBe('done');
        });

        it.each([
            ['the second password is checked', { secondPassword: true }, 'unlock'],
            ['the new password is set', { temporaryPassword: true, keys: 0 }, 'newPassword'],
        ] as const)('ignores back while %s', async (_, account, screen) => {
            const pending = deferred<AuthSession>();
            const { actor, spies } = startActor({
                created: makeCreatedAuth(account),
                unlockKeys: () => pending.promise,
            });
            spies.setupPassword.mockImplementation(() => pending.promise);
            await submitCredentials(actor);
            expect(passwordAccount(actor).getSnapshot().context.screen).toBe(screen);
            passwordAccount(actor).send(
                screen === 'unlock'
                    ? { type: 'unlock.submitted', payload: { password: 'secret' } }
                    : { type: 'newPassword.submitted', payload: { password: 'new' } }
            );
            // By then a session may be persisted or the password changed, which leaving would drop
            expect(passwordAccount(actor).getSnapshot().can({ type: 'decision.back' })).toBe(false);
            passwordAccount(actor).send({ type: 'decision.back' });
            expect(
                passwordAccount(actor)
                    .getSnapshot()
                    .matches({ [screen]: 'submitting' })
            ).toBe(true);
            pending.resolve(session);
            expect((await waitUntilSettled(actor)).status).toBe('done');
        });
    });

    describe('sso', () => {
        const startOnSSO = async (sso: NonNullable<AuthOptions['sso']>, overrides: Overrides = {}) => {
            const started = startActor({
                created: makeCreatedAuth({ authType: AuthType.ExternalSSO, sso }),
                ssoData: makeSSOData(sso),
                ...overrides,
            });
            await submitCredentials(started.actor);
            return started;
        };
        /** The SSO steps, run by the sign-in as a child. */
        const sso = (actor: Actor) => {
            const child = actor.getSnapshot().children.sso;
            if (!child) {
                throw new Error('The SSO steps are not running');
            }
            return child;
        };
        const ssoScreen = (actor: Actor) => sso(actor).getSnapshot().context.screen;
        const waitUntilSSOSettled = (actor: Actor) =>
            waitFor(sso(actor), (snap) => !snap.hasTag(SSOStateMachineTags.submitting), { timeout: 1_000 });
        const waitUntilDone = (actor: Actor) => waitFor(actor, (snap) => snap.status === 'done', { timeout: 1_000 });

        it('opens the screen for the SSO intent', async () => {
            const { actor } = await startOnSSO({ step: SSOLoginCapabilites.OTHER_DEVICES });
            expect(actor.getSnapshot().context.step).toBe('sso');
            expect(ssoScreen(actor)).toBe('otherDevices');
        });

        it('polls for approval on the device screen, then signs in', async () => {
            const { actor, polls, spies } = await startOnSSO({ step: SSOLoginCapabilites.OTHER_DEVICES });
            expect(polls).toHaveLength(1);
            polls[0].sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
            expect((await waitUntilDone(actor)).status).toBe('done');
            expect(polls[0].stopped).toBe(true);
            expect(spies.completeSignIn).toHaveBeenCalledTimes(1);
        });

        it('reuses the addresses loaded while preparing when the device is approved', async () => {
            const addresses = [{ ID: 'address' }] as unknown as Address[];
            const confirmSSODevice = jest.fn((_args?: { input: { auth: SignInAuthState } }) =>
                Promise.resolve<SSOSignInResult>({ type: 'session', session })
            );
            const sso = { step: SSOLoginCapabilites.OTHER_DEVICES };
            const { actor, polls } = await startOnSSO(sso, {
                confirmSSODevice,
                prepareSSO: () =>
                    Promise.resolve<PrepareSSOResult>({
                        type: 'sso',
                        // The unlock and inactive SSO data carry the addresses they loaded
                        ssoData: { ...makeSSOData(sso), addresses } as SSODataTypes,
                    }),
            });
            polls[0].sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
            await waitUntilDone(actor);
            expect(confirmSSODevice.mock.calls[0][0]?.input.auth.account.addresses).toBe(addresses);
        });

        it('stops polling when confirming the approved device fails, like main', async () => {
            const error = new Error('boom');
            const { actor, polls, errors } = await startOnSSO(
                { step: SSOLoginCapabilites.OTHER_DEVICES },
                { confirmSSODevice: () => Promise.reject(error) }
            );
            polls[0].sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('otherDevices');
            expect(errors()).toEqual([error]);
            expect(polls).toHaveLength(1);
            expect(polls[0].stopped).toBe(true);
        });

        it('ends the attempt when polling finds the session gone, and reports it', async () => {
            const error = { status: 401 };
            const { actor, polls, errors } = await startOnSSO({ step: SSOLoginCapabilites.OTHER_DEVICES });
            polls[0].sendBack({ type: 'sso.device.failed', error });
            expect(actor.getSnapshot().matches('awaitingCredentials')).toBe(true);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(errors()).toEqual([error]);
            expect(polls[0].stopped).toBe(true);
        });

        it('shows the rejection, and frees the organization logo when going back', async () => {
            const { actor, polls, ssoData } = await startOnSSO({ step: SSOLoginCapabilites.OTHER_DEVICES });
            polls[0].sendBack({ type: 'sso.device.rejected' });
            expect(ssoScreen(actor)).toBe('rejected');
            expect(polls[0].stopped).toBe(true);
            sso(actor).send({ type: 'decision.back' });
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(ssoData?.organizationData.logo?.cleanup).toHaveBeenCalledTimes(1);
        });

        it('only offers the ways out the SSO capabilities allow', async () => {
            const { actor } = await startOnSSO({ step: SSOLoginCapabilites.OTHER_DEVICES });
            expect(sso(actor).getSnapshot().can({ type: 'sso.backupPassword.requested' })).toBe(false);
            sso(actor).send({ type: 'sso.backupPassword.requested' });
            expect(ssoScreen(actor)).toBe('otherDevices');
        });

        it('goes back from the backup password to the device screen', async () => {
            const { actor, polls } = await startOnSSO({
                step: SSOLoginCapabilites.OTHER_DEVICES,
                capabilities: [SSOLoginCapabilites.ENTER_BACKUP_PASSWORD],
            });
            sso(actor).send({ type: 'sso.backupPassword.requested' });
            expect(ssoScreen(actor)).toBe('backupPassword');
            expect(polls[0].stopped).toBe(true);
            sso(actor).send({ type: 'decision.back' });
            expect(ssoScreen(actor)).toBe('otherDevices');
            expect(polls).toHaveLength(2);
        });

        it('goes back from the backup password to the confirmation code screen it was opened from', async () => {
            const { actor, polls } = await startOnSSO({
                step: SSOLoginCapabilites.ASK_ADMIN,
                capabilities: [SSOLoginCapabilites.ENTER_BACKUP_PASSWORD],
            });
            sso(actor).send({ type: 'sso.adminHelp.confirmed' });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('adminConfirmationCode');
            sso(actor).send({ type: 'sso.backupPassword.requested' });
            expect(ssoScreen(actor)).toBe('backupPassword');
            sso(actor).send({ type: 'decision.back' });
            expect(ssoScreen(actor)).toBe('adminConfirmationCode');
            // Waiting for the administrator again
            expect(polls).toHaveLength(2);
        });

        it('goes back from the backup password to the request screen it was opened from', async () => {
            const { actor } = await startOnSSO({
                step: SSOLoginCapabilites.ASK_ADMIN,
                capabilities: [SSOLoginCapabilites.ENTER_BACKUP_PASSWORD],
            });
            sso(actor).send({ type: 'sso.backupPassword.requested' });
            expect(ssoScreen(actor)).toBe('backupPassword');
            sso(actor).send({ type: 'decision.back' });
            expect(ssoScreen(actor)).toBe('askAdmin');
        });

        it('asks the administrator, then waits for their approval', async () => {
            const { actor, polls } = await startOnSSO({ step: SSOLoginCapabilites.ASK_ADMIN });
            expect(ssoScreen(actor)).toBe('askAdmin');
            expect(polls).toHaveLength(0);
            sso(actor).send({ type: 'sso.adminHelp.confirmed' });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('adminConfirmationCode');
            expect(polls).toHaveLength(1);
        });

        it('asks the administrator once; asking again waits for their approval', async () => {
            const requestAdminApproval = jest.fn(() => Promise.resolve());
            const { actor } = await startOnSSO(
                {
                    step: SSOLoginCapabilites.OTHER_DEVICES,
                    capabilities: [SSOLoginCapabilites.ASK_ADMIN],
                },
                { requestAdminApproval }
            );
            sso(actor).send({ type: 'sso.adminHelp.requested' });
            sso(actor).send({ type: 'sso.adminHelp.confirmed' });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('adminConfirmationCode');
            sso(actor).send({ type: 'decision.back' });
            expect(ssoScreen(actor)).toBe('otherDevices');
            sso(actor).send({ type: 'sso.adminHelp.requested' });
            expect(ssoScreen(actor)).toBe('adminConfirmationCode');
            expect(requestAdminApproval).toHaveBeenCalledTimes(1);
        });

        it('ignores the ways out while the administrator is asked, so the request is sent once', async () => {
            const request = deferred<void>();
            const requestAdminApproval = jest.fn(() => request.promise);
            const { actor } = await startOnSSO(
                { step: SSOLoginCapabilites.ASK_ADMIN, capabilities: [SSOLoginCapabilites.ENTER_BACKUP_PASSWORD] },
                { requestAdminApproval }
            );
            sso(actor).send({ type: 'sso.adminHelp.confirmed' });
            expect(sso(actor).getSnapshot().can({ type: 'decision.back' })).toBe(false);
            expect(sso(actor).getSnapshot().can({ type: 'sso.backupPassword.requested' })).toBe(false);
            sso(actor).send({ type: 'decision.back' });
            sso(actor).send({ type: 'sso.backupPassword.requested' });
            expect(ssoScreen(actor)).toBe('askAdmin');
            request.resolve();
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('adminConfirmationCode');
            expect(requestAdminApproval).toHaveBeenCalledTimes(1);
        });

        it('stays on the request screen when asking the administrator fails', async () => {
            const error = new Error('boom');
            const { actor, errors } = await startOnSSO(
                { step: SSOLoginCapabilites.ASK_ADMIN },
                { requestAdminApproval: () => Promise.reject(error) }
            );
            sso(actor).send({ type: 'sso.adminHelp.confirmed' });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('askAdmin');
            expect(errors()).toEqual([error]);
        });

        it('frees the organization logo after signing in too', async () => {
            const { actor, polls, ssoData } = await startOnSSO({ step: SSOLoginCapabilites.OTHER_DEVICES });
            polls[0].sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
            await waitUntilDone(actor);
            expect(ssoData?.organizationData.logo?.cleanup).toHaveBeenCalledTimes(1);
        });

        it('frees the organization logo when the page unmounts mid-flow', async () => {
            const { actor, ssoData } = await startOnSSO({ step: SSOLoginCapabilites.OTHER_DEVICES });
            actor.stop();
            expect(ssoData?.organizationData.logo?.cleanup).toHaveBeenCalledTimes(1);
        });

        it('ignores the ways out while the backup password is checked, and takes them again after a wrong one', async () => {
            const unlock = deferred<AuthSession>();
            const { actor } = await startOnSSO(
                { step: SSOLoginCapabilites.ENTER_BACKUP_PASSWORD, capabilities: [SSOLoginCapabilites.ASK_ADMIN] },
                {
                    unlockWithBackupPassword: () =>
                        unlock.promise.then(() => Promise.reject(new PasswordError('Wrong password'))),
                }
            );
            expect(sso(actor).getSnapshot().can({ type: 'sso.adminHelp.requested' })).toBe(true);
            sso(actor).send({ type: 'sso.backupPassword.submitted', payload: { password: 'wrong' } });
            // The unlock may already have persisted a session, which leaving would drop
            expect(sso(actor).getSnapshot().can({ type: 'sso.adminHelp.requested' })).toBe(false);
            expect(sso(actor).getSnapshot().can({ type: 'decision.back' })).toBe(false);
            sso(actor).send({ type: 'sso.adminHelp.requested' });
            expect(ssoScreen(actor)).toBe('backupPassword');
            unlock.resolve(session);
            await waitUntilSSOSettled(actor);
            expect(sso(actor).getSnapshot().can({ type: 'sso.adminHelp.requested' })).toBe(true);
            expect(sso(actor).getSnapshot().can({ type: 'decision.back' })).toBe(true);
        });

        it('keeps the device screen and ignores its ways out while the approved device is confirmed', async () => {
            const confirm = deferred<SSOSignInResult>();
            const { actor, polls } = await startOnSSO(
                { step: SSOLoginCapabilites.OTHER_DEVICES, capabilities: [SSOLoginCapabilites.ENTER_BACKUP_PASSWORD] },
                { confirmSSODevice: () => confirm.promise.then(() => Promise.reject(new Error('boom'))) }
            );
            polls[0].sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
            expect(sso(actor).getSnapshot().hasTag(SSOStateMachineTags.submitting)).toBe(true);
            expect(ssoScreen(actor)).toBe('otherDevices');
            expect(sso(actor).getSnapshot().can({ type: 'sso.backupPassword.requested' })).toBe(false);
            expect(sso(actor).getSnapshot().can({ type: 'decision.back' })).toBe(false);
            sso(actor).send({ type: 'decision.back' });
            expect(ssoScreen(actor)).toBe('otherDevices');
            // Once confirming failed, the user can leave again
            confirm.resolve({ type: 'session', session });
            await waitUntilSSOSettled(actor);
            expect(sso(actor).getSnapshot().can({ type: 'sso.backupPassword.requested' })).toBe(true);
        });

        it('ignores back while the session is handed over', async () => {
            const pending = deferred<void>();
            const { actor } = await startOnSSO(
                { step: SSOLoginCapabilites.NEW_BACKUP_PASSWORD },
                { completeSignIn: () => pending.promise }
            );
            sso(actor).send({ type: 'sso.newBackupPassword.submitted', payload: { password: 'new' } });
            await waitUntil(() => sso(actor).getSnapshot().matches('completing'));
            expect(sso(actor).getSnapshot().can({ type: 'decision.back' })).toBe(false);
            sso(actor).send({ type: 'decision.back' });
            expect(sso(actor).getSnapshot().matches('completing')).toBe(true);
            pending.resolve();
            expect((await waitUntilDone(actor)).status).toBe('done');
        });

        it('lets the user retry a wrong backup password', async () => {
            let attempt = 0;
            const { actor, errors } = await startOnSSO(
                { step: SSOLoginCapabilites.ENTER_BACKUP_PASSWORD },
                {
                    unlockWithBackupPassword: () =>
                        attempt++ === 0
                            ? Promise.reject(new PasswordError('Wrong password'))
                            : Promise.resolve<SSOSignInResult>({ type: 'session', session }),
                }
            );
            sso(actor).send({ type: 'sso.backupPassword.submitted', payload: { password: 'wrong' } });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('backupPassword');
            expect(errors()).toHaveLength(1);
            sso(actor).send({ type: 'sso.backupPassword.submitted', payload: { password: 'right' } });
            expect((await waitUntilDone(actor)).status).toBe('done');
        });

        it('reports an error that ends the SSO steps, and goes back to the credentials form', async () => {
            const error = new Error('boom');
            const { actor, errors, ssoData } = await startOnSSO(
                { step: SSOLoginCapabilites.ENTER_BACKUP_PASSWORD },
                { unlockWithBackupPassword: () => Promise.reject(error) }
            );
            sso(actor).send({ type: 'sso.backupPassword.submitted', payload: { password: 'backup' } });
            await waitFor(actor, (snap) => snap.matches('awaitingCredentials'), { timeout: 1_000 });
            expect(errors()).toEqual([error]);
            expect(ssoData?.organizationData.logo?.cleanup).toHaveBeenCalledTimes(1);
        });

        it('creates no session for a member who unlocked with a temporary password until the new backup password is set', async () => {
            const setPasswordData = {
                type: 'set-password',
                keyPassword: 'key',
                intent: { step: SSOLoginCapabilites.NEW_BACKUP_PASSWORD, capabilities: new Set() },
                organizationData: { logo: { cleanup: jest.fn() } },
            } as unknown as SSOSetPasswordData;
            const { actor, spies } = await startOnSSO(
                { step: SSOLoginCapabilites.ENTER_BACKUP_PASSWORD },
                {
                    unlockWithBackupPassword: () =>
                        Promise.resolve<SSOSignInResult>({
                            type: 'set-password',
                            ssoData: setPasswordData,
                            user: { Flags: { 'has-temporary-password': true } } as unknown as User,
                        }),
                }
            );
            sso(actor).send({ type: 'sso.backupPassword.submitted', payload: { password: 'temporary' } });
            await waitUntilSSOSettled(actor);
            // Nothing is persisted yet, so reloading here can't sign the member in
            expect(ssoScreen(actor)).toBe('adminGranted');
            expect(sso(actor).getSnapshot().context.session).toBeUndefined();
            sso(actor).send({ type: 'sso.continued' });
            expect(ssoScreen(actor)).toBe('newBackupPassword');
            sso(actor).send({ type: 'sso.newBackupPassword.submitted', payload: { password: 'new backup' } });
            expect((await waitUntilDone(actor)).status).toBe('done');
            expect(spies.changeBackupPassword).toHaveBeenCalledWith(
                expect.objectContaining({ ssoData: setPasswordData, session: undefined, password: 'new backup' })
            );
            expect(spies.completeSignIn).toHaveBeenCalledTimes(1);
        });

        it('creates no session for an approved member with a temporary password until the new backup password is set', async () => {
            const setPasswordData = {
                type: 'set-password',
                keyPassword: 'key',
                intent: { step: SSOLoginCapabilites.NEW_BACKUP_PASSWORD, capabilities: new Set() },
                organizationData: { logo: { cleanup: jest.fn() } },
            } as unknown as SSOSetPasswordData;
            const approvedUser = { Flags: { 'has-temporary-password': true } } as unknown as User;
            const { actor, polls, spies } = await startOnSSO(
                { step: SSOLoginCapabilites.OTHER_DEVICES },
                {
                    confirmSSODevice: () =>
                        Promise.resolve<SSOSignInResult>({
                            type: 'set-password',
                            ssoData: setPasswordData,
                            user: approvedUser,
                        }),
                }
            );
            polls[0].sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
            await waitUntilSSOSettled(actor);
            // Nothing is persisted yet, so reloading here can't sign the member in
            expect(ssoScreen(actor)).toBe('adminGranted');
            expect(sso(actor).getSnapshot().context.session).toBeUndefined();
            expect(spies.completeSignIn).not.toHaveBeenCalled();

            sso(actor).send({ type: 'sso.continued' });
            sso(actor).send({ type: 'sso.newBackupPassword.submitted', payload: { password: 'new backup' } });
            expect((await waitUntilDone(actor)).status).toBe('done');
            expect(spies.changeBackupPassword).toHaveBeenCalledWith(
                expect.objectContaining({ ssoData: setPasswordData, session: undefined, password: 'new backup' })
            );
            expect(spies.changeBackupPassword.mock.calls[0][0]).toMatchObject({
                auth: { account: { user: approvedUser } },
            });
            expect(spies.completeSignIn).toHaveBeenCalledTimes(1);
        });

        it('changes the backup password with the new keys for a member with a temporary password who just set them up', async () => {
            const setupUser = { Keys: [{ ID: 'key' }], Flags: { 'has-temporary-password': true } } as unknown as User;
            const setupSession = { data: { User: setupUser } } as unknown as AuthSession;
            const { actor, spies } = await startOnSSO(
                { step: SSOLoginCapabilites.SETUP_BACKUP_PASSWORD },
                { setupSSOKeys: () => Promise.resolve(setupSession) }
            );
            expect(ssoScreen(actor)).toBe('setupKeys');
            sso(actor).send({ type: 'sso.setup.submitted', payload: { password: 'backup' } });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('adminGranted');

            sso(actor).send({ type: 'sso.continued' });
            sso(actor).send({ type: 'sso.newBackupPassword.submitted', payload: { password: 'new backup' } });
            expect((await waitUntilDone(actor)).status).toBe('done');
            const { auth, session: changedWith } = spies.changeBackupPassword.mock.calls[0][0] as {
                auth: SignInAuthState;
                session: AuthSession | undefined;
            };
            expect(changedWith).toBe(setupSession);
            // The user with the new keys, not the one loaded before they existed; the addresses are loaded again
            expect(auth.account.user).toBe(setupUser);
            expect(auth.account.addresses).toBeUndefined();
        });

        it('goes straight to the new backup password for an approved member when the organization disabled it', async () => {
            const { actor, polls } = await startOnSSO(
                { step: SSOLoginCapabilites.OTHER_DEVICES, backupPasswordDisabled: true },
                {
                    confirmSSODevice: () =>
                        Promise.resolve<SSOSignInResult>({
                            type: 'set-password',
                            ssoData: { type: 'set-password' } as unknown as SSOSetPasswordData,
                            user: {} as User,
                        }),
                }
            );
            polls[0].sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('newBackupPassword');
        });

        it('skips the backup password intro when the organization disabled it', async () => {
            const { actor } = await startOnSSO(
                { step: SSOLoginCapabilites.ENTER_BACKUP_PASSWORD, backupPasswordDisabled: true },
                {
                    unlockWithBackupPassword: () =>
                        Promise.resolve<SSOSignInResult>({
                            type: 'set-password',
                            ssoData: { type: 'set-password' } as unknown as SSOSetPasswordData,
                            user: {} as User,
                        }),
                }
            );
            sso(actor).send({ type: 'sso.backupPassword.submitted', payload: { password: 'backup' } });
            await waitUntilSSOSettled(actor);
            expect(ssoScreen(actor)).toBe('newBackupPassword');
        });

        it('sets up keys on the first sign-in', async () => {
            const { actor, spies } = await startOnSSO({ step: SSOLoginCapabilites.SETUP_BACKUP_PASSWORD });
            expect(ssoScreen(actor)).toBe('setupKeys');
            sso(actor).send({ type: 'sso.setup.submitted', payload: { password: 'backup' } });
            expect((await waitUntilDone(actor)).status).toBe('done');
            expect(spies.setupSSOKeys).toHaveBeenCalledWith(expect.objectContaining({ password: 'backup' }));
        });

        it('introduces the first sign-in after conversion, then asks for the old password', async () => {
            const { actor } = await startOnSSO({
                step: SSOLoginCapabilites.FIRST_LOGIN_AFTER_CONVERSION,
                capabilities: [SSOLoginCapabilites.ENTER_BACKUP_PASSWORD],
            });
            expect(ssoScreen(actor)).toBe('firstLoginAfterConversion');
            sso(actor).send({ type: 'sso.continued' });
            expect(ssoScreen(actor)).toBe('backupPassword');
            sso(actor).send({ type: 'decision.back' });
            expect(ssoScreen(actor)).toBe('firstLoginAfterConversion');
        });
    });

    describe('completing', () => {
        it('keeps the current step on screen while the session is handed over', async () => {
            const pending = deferred<void>();
            const { actor } = startActor({
                created: makeCreatedAuth({ twoFactor: true }),
                completeSignIn: () => pending.promise,
            });
            await submitCredentials(actor);
            passwordAccount(actor).send({
                type: 'twoFactor.submitted',
                payload: { credentials: { type: 'code', payload: '123456' } },
            });
            await waitUntil(() => passwordAccount(actor).getSnapshot().matches('completing'));
            // The 2FA screen stays up with its loading state
            expect(actor.getSnapshot().context.step).toBe('passwordAccount');
            expect(passwordAccount(actor).getSnapshot().context.screen).toBe('twoFactor');
            expect(passwordAccount(actor).getSnapshot().hasTag('submitting')).toBe(true);
            pending.resolve();
            expect((await waitUntilSettled(actor)).status).toBe('done');
        });

        it('returns to credentials and reports the error when onLogin fails', async () => {
            const error = new Error('boom');
            const { actor, errors } = startActor({ completeSignIn: () => Promise.reject(error) });
            await submitCredentials(actor);
            expect(
                credentialsFlow(actor)
                    .getSnapshot()
                    .matches({ form: { srp: 'idle' } })
            ).toBe(true);
            expect(errors()).toEqual([error]);
        });
    });
});

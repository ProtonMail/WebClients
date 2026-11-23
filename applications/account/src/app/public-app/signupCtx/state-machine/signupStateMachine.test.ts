import { type CallbackLogicFunction, createActor, fromCallback, fromPromise, waitFor } from 'xstate';

import { createPromise } from '@proton/shared/lib/helpers/promise';
import type { ReferralData } from '@proton/shared/lib/interfaces/referral';

import type { OnLoginCallbackResult } from '../../authSession';
import type { AccountData } from '../../signup/interfaces';
import type { SignupContextSubscriptionData } from '../context/helpers/handleSetupUser';
import { InvalidReferrerError } from '../helpers/validateReferrer';
import type { SetupUserResult } from './signupActors';
import { createSignupOperations } from './signupOperations';
import { type SignupEmitted, signupStateMachine } from './signupStateMachine';

const accountData = { password: 'password' } as AccountData;
const setupResult = { session: { localID: 1 }, recoveryPhraseData: { payload: {} } } as unknown as SetupUserResult;

const start = ({
    watchSession = () => {},
    startAuth = async () => {},
    loadDomains = async () => ['proton.me'],
    checkReferral = async () => undefined,
    initializePayments = async () => {},
    createUser = async () => {},
    setupUser = async () => setupResult,
    setupSubscription = async () => undefined,
    setOrgName = async () => {},
    setDisplayName = async () => {},
    setPassword = async ({ password }) => ({
        accountData: { ...accountData, password },
        setupResult: { ...setupResult, keyPassword: 'key-password' },
    }),
    sendRecoveryPhrase = async () => {},
    login = async () => {},
}: {
    watchSession?: CallbackLogicFunction;
    startAuth?: () => Promise<void>;
    loadDomains?: () => Promise<string[]>;
    checkReferral?: () => Promise<ReferralData | undefined>;
    initializePayments?: () => Promise<void>;
    createUser?: () => Promise<void>;
    setupUser?: (input: { isRetry: boolean }) => Promise<SetupUserResult>;
    setupSubscription?: (input: { subscriptionData: unknown }) => Promise<SetupUserResult['subscription']>;
    setOrgName?: () => Promise<void>;
    setDisplayName?: () => Promise<void>;
    setPassword?: (input: { password: string }) => Promise<{ accountData: AccountData; setupResult: SetupUserResult }>;
    sendRecoveryPhrase?: () => Promise<void>;
    login?: () => Promise<OnLoginCallbackResult | void>;
} = {}) => {
    const actions = {
        onReferralCheckError: vi.fn(),
        reportInitialized: vi.fn(),
        reportInitializationError: vi.fn(),
        reportInvalidStage: vi.fn(),
        reportMissingData: vi.fn(),
        reportErrorPage: vi.fn(),
        reportAccountCreation: vi.fn(),
        reportSubscription: vi.fn(),
    };
    const emitted: SignupEmitted[] = [];
    const actor = createActor(
        signupStateMachine.provide({
            actors: {
                watchSession: fromCallback(watchSession),
                startAuth: fromPromise(startAuth),
                loadDomains: fromPromise(loadDomains),
                checkReferral: fromPromise(checkReferral),
                initializePayments: fromPromise(initializePayments),
                createUser: fromPromise(createUser),
                setupUser: fromPromise(({ input }) => setupUser(input)),
                setupSubscription: fromPromise(({ input }) => setupSubscription(input)),
                setOrgName: fromPromise(setOrgName),
                setDisplayName: fromPromise(setDisplayName),
                setPassword: fromPromise(({ input }) => setPassword(input)),
                sendRecoveryPhrase: fromPromise(sendRecoveryPhrase),
                login: fromPromise(login),
            },
            actions,
        })
    );
    actor.on('*', (event) => emitted.push(event));
    actor.start();
    const ready = () => waitFor(actor, (state) => state.matches('ready'));
    return { actor, actions, emitted, ready, signup: createSignupOperations(actor) };
};

describe('signupStateMachine', () => {
    it('loads what the signup needs before it is ready', async () => {
        const { actions, ready } = start();
        const { context } = await ready();
        expect(context).toMatchObject({ domains: ['proton.me'] });
        expect(actions.reportInitialized).toHaveBeenCalledTimes(1);
    });

    it('shows a failed initialization once and still lets the user sign up', async () => {
        const error = new Error('offline');
        const { actions, emitted, ready } = start({
            loadDomains: () => Promise.reject(error),
            initializePayments: () => Promise.reject(error),
        });
        await ready();
        expect(emitted).toEqual([{ type: 'error', error }]);
        expect(actions.reportInitializationError).toHaveBeenCalledTimes(1);
        expect(actions.reportInitialized).not.toHaveBeenCalled();
    });

    it('reports a failed payments load without showing it, as the steps that take a payment show it', async () => {
        const error = new Error('offline');
        const { actions, emitted, ready } = start({ initializePayments: () => Promise.reject(error) });
        await ready();
        expect(emitted).toEqual([]);
        expect(actions.reportInitializationError).toHaveBeenCalledWith(expect.anything(), { error });
        expect(actions.reportInitialized).not.toHaveBeenCalled();
    });

    it('stops loading the domains once their request fails, while the rest still loads', async () => {
        const domains = createPromise<string[]>();
        const { actor } = start({
            loadDomains: () => domains.promise,
            initializePayments: () => new Promise(() => {}),
        });
        await waitFor(actor, (state) => state.matches({ initializing: 'loading' }));
        expect(actor.getSnapshot().hasTag('loadingDomains')).toBe(true);
        domains.reject(new Error('offline'));
        await waitFor(actor, (state) => !state.hasTag('loadingDomains'));
        expect(actor.getSnapshot().matches('initializing')).toBe(true);
    });

    it('leaves an unknown referrer to the flow', async () => {
        const { actions, emitted, ready } = start({ checkReferral: () => Promise.reject(new InvalidReferrerError()) });
        await ready();
        expect(actions.onReferralCheckError).toHaveBeenCalledTimes(1);
        expect(emitted).toEqual([]);
        expect(actions.reportInitialized).not.toHaveBeenCalled();
    });

    it('creates a user submitted while the signup loads once it is ready', async () => {
        const domains = createPromise<string[]>();
        const createUser = vi.fn(async () => {});
        const { actor, signup } = start({ loadDomains: () => domains.promise, createUser });
        actor.send({ type: 'account.submitted', accountData });
        const creating = signup.createUser();
        await waitFor(actor, (state) => state.matches({ initializing: 'loading' }));
        expect(createUser).not.toHaveBeenCalled();
        domains.resolve(['proton.me']);
        await creating;
        expect(createUser).toHaveBeenCalledTimes(1);
        expect(actor.getSnapshot().matches('userCreated')).toBe(true);
    });

    it('does not create a user without account data', async () => {
        const createUser = vi.fn(async () => {});
        const { actions, ready, signup } = start({ createUser });
        await ready();
        await signup.createUser();
        expect(actions.reportMissingData).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ operation: 'user.create' })
        );
        expect(createUser).not.toHaveBeenCalled();
    });

    it('creates the user, sets it up and signs it in', async () => {
        const login = vi.fn(async () => {});
        const { actor, ready, signup } = start({ login });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();
        expect(actor.getSnapshot().context.setupResult).toBe(setupResult);
        await signup.setDisplayName('Name');
        await signup.login();
        expect(login).toHaveBeenCalledTimes(1);
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it('rejects with the error of a failed operation, which can be retried', async () => {
        const error = new Error('taken');
        const createUser = vi.fn<() => Promise<void>>().mockRejectedValueOnce(error).mockResolvedValueOnce();
        const { actor, ready, signup } = start({ createUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await expect(signup.createUser()).rejects.toBe(error);
        expect(actor.getSnapshot().matches('ready')).toBe(true);
        await signup.createUser();
        expect(actor.getSnapshot().matches('userCreated')).toBe(true);
    });

    it('only retries the setup when the same account is submitted again after a failed setup', async () => {
        const createUser = vi.fn(async () => {});
        const setupUser = vi
            .fn<(options: { isRetry: boolean }) => Promise<SetupUserResult>>()
            .mockRejectedValueOnce(new Error('declined'))
            .mockResolvedValueOnce(setupResult);
        const { actor, ready, signup } = start({ createUser, setupUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await expect(signup.setupUser()).rejects.toThrow('declined');

        // The form submits again: the account data is new, with a new challenge payload, but the same account
        actor.send({
            type: 'account.submitted',
            accountData: { ...accountData, payload: {} as AccountData['payload'] },
        });
        await signup.createUser();
        await signup.setupUser();

        expect(createUser).toHaveBeenCalledTimes(1);
        expect(setupUser.mock.calls.map(([input]) => input.isRetry)).toEqual([false, true]);
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it('creates and sets up another account when a different one is submitted after a failed setup', async () => {
        const createUser = vi.fn(async () => {});
        const setupUser = vi
            .fn<(options: { isRetry: boolean }) => Promise<SetupUserResult>>()
            .mockRejectedValueOnce(new Error('declined'))
            .mockResolvedValueOnce(setupResult);
        const { actor, ready, signup } = start({ createUser, setupUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await expect(signup.setupUser()).rejects.toThrow('declined');

        actor.send({ type: 'account.submitted', accountData: { ...accountData, email: 'other@example.com' } });
        await signup.createUser();

        expect(createUser).toHaveBeenCalledTimes(2);
        expect(actor.getSnapshot().matches('userCreated')).toBe(true);
        await signup.setupUser();
        expect(setupUser.mock.calls.map(([input]) => input.isRetry)).toEqual([false, false]);
    });

    it('only retries the setup of the created account when it is submitted again after another failed', async () => {
        const createUser = vi
            .fn<() => Promise<void>>()
            .mockResolvedValueOnce()
            .mockRejectedValueOnce(new Error('taken'));
        const setupUser = vi
            .fn<(options: { isRetry: boolean }) => Promise<SetupUserResult>>()
            .mockRejectedValueOnce(new Error('declined'))
            .mockResolvedValueOnce(setupResult);
        const { actor, ready, signup } = start({ createUser, setupUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await expect(signup.setupUser()).rejects.toThrow('declined');

        actor.send({ type: 'account.submitted', accountData: { ...accountData, email: 'other@example.com' } });
        await expect(signup.createUser()).rejects.toThrow('taken');
        expect(actor.getSnapshot().matches('ready')).toBe(true);

        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();

        expect(createUser).toHaveBeenCalledTimes(2);
        expect(setupUser.mock.calls.map(([input]) => input.isRetry)).toEqual([false, true]);
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it('signs in with the password the user chose after the setup', async () => {
        const login = vi.fn(async (_: unknown) => {});
        const { actor, ready, signup } = start({ login: () => login(actor.getSnapshot().context) });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();
        await signup.setPassword('chosen');
        await signup.login();
        expect(login).toHaveBeenCalledWith(
            expect.objectContaining({
                accountData: expect.objectContaining({ password: 'chosen' }),
                setupResult: expect.objectContaining({ keyPassword: 'key-password' }),
            })
        );
    });

    it('subscribes a set-up user with a payment submitted after the setup, and can retry it', async () => {
        const subscriptionData = { planIDs: { vpn2024: 1 } } as unknown as SignupContextSubscriptionData;
        const subscription = { ID: 'subscription' } as SetupUserResult['subscription'];
        const setupSubscription = vi
            .fn<(options: { subscriptionData: unknown }) => Promise<SetupUserResult['subscription']>>()
            .mockRejectedValueOnce(new Error('declined'))
            .mockResolvedValueOnce(subscription);
        const { actor, actions, ready, signup } = start({ setupSubscription });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();
        actor.send({ type: 'payment.submitted', subscriptionData });
        await expect(signup.setupSubscription()).rejects.toThrow('declined');
        await signup.setupSubscription();
        expect(setupSubscription).toHaveBeenLastCalledWith(expect.objectContaining({ subscriptionData }));
        expect(actions.reportSubscription).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({ subscriptionData, subscription })
        );
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it.each<[string, (signup: ReturnType<typeof createSignupOperations>) => Promise<void>]>([
        ['setOrgName', (signup) => signup.setOrgName('Org')],
        ['setDisplayName', (signup) => signup.setDisplayName('Name')],
        ['setPassword', (signup) => signup.setPassword('chosen')],
        ['sendRecoveryPhrase', (signup) => signup.sendRecoveryPhrasePayload()],
        ['login', (signup) => signup.login()],
    ])('rejects with the error of a failed %s, and the steps after the setup go on', async (name, run) => {
        const error = new Error(`${name} failed`);
        const request = createPromise<never>();
        const { actor, ready, signup } = start({ [name]: () => request.promise });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();
        const running = run(signup);
        await waitFor(actor, (state) => !state.matches({ userSetup: 'idle' }));
        request.reject(error);
        await expect(running).rejects.toBe(error);
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it.each<[string, (signup: ReturnType<typeof createSignupOperations>) => Promise<void>]>([
        ['setupSubscription', (signup) => signup.setupSubscription()],
        ['setOrgName', (signup) => signup.setOrgName('Org')],
        ['setDisplayName', (signup) => signup.setDisplayName('Name')],
        ['setPassword', (signup) => signup.setPassword('chosen')],
        ['sendRecoveryPhrase', (signup) => signup.sendRecoveryPhrasePayload()],
        ['login', (signup) => signup.login()],
    ])('resolves once a successful %s is over', async (name, run) => {
        // setPassword's actor answers with the account and setup result, the others with nothing
        const request = createPromise<{ accountData: AccountData; setupResult: SetupUserResult } | undefined>();
        const { actor, ready, signup } = start({ [name]: () => request.promise });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();
        let resolved = false;
        const running = run(signup).then(() => {
            resolved = true;
        });
        await waitFor(actor, (state) => !state.matches({ userSetup: 'idle' }));
        expect(resolved).toBe(false);
        request.resolve(name === 'setPassword' ? { accountData, setupResult } : undefined);
        await running;
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it('reports the subscription a paid setup made', async () => {
        const subscriptionData = { planIDs: { vpn2024: 1 } } as unknown as SignupContextSubscriptionData;
        const subscription = { ID: 'subscription' } as SetupUserResult['subscription'];
        const user = { ID: 'user' } as SetupUserResult['user'];
        const { actor, actions, ready, signup } = start({
            setupUser: async () => ({ ...setupResult, subscription, user }),
        });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        actor.send({ type: 'payment.submitted', subscriptionData });
        await signup.createUser();
        await signup.setupUser();
        expect(actions.reportSubscription).toHaveBeenCalledWith(expect.anything(), {
            subscriptionData,
            subscription,
            user,
        });
    });

    it('reports the account creation once the user is set up, or once a reservation pays', async () => {
        const subscriptionData = { planIDs: { vpn2024: 1 } } as unknown as SignupContextSubscriptionData;
        const setUp = start();
        await setUp.ready();
        setUp.actor.send({ type: 'account.submitted', accountData });
        await setUp.signup.createUser();
        await setUp.signup.setupUser();
        expect(setUp.actions.reportAccountCreation).toHaveBeenCalledTimes(1);

        const reserved = start();
        await reserved.ready();
        reserved.actor.send({ type: 'account.submitted', accountData });
        await reserved.signup.createUser();
        await reserved.signup.setupUser({ reservation: true });
        expect(reserved.actions.reportAccountCreation).not.toHaveBeenCalled();
        reserved.actor.send({ type: 'payment.submitted', subscriptionData });
        await reserved.signup.setupSubscription();
        expect(reserved.actions.reportAccountCreation).toHaveBeenCalledWith(expect.anything(), {
            accountData,
            subscriptionData,
        });
    });

    it('retries a failed setup, which checks whether its payment went through', async () => {
        const setupUser = vi
            .fn<(options: { isRetry: boolean }) => Promise<SetupUserResult>>()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(setupResult);
        const { actor, ready, signup } = start({ setupUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await expect(signup.setupUser()).rejects.toThrow('offline');
        await signup.setupUser();
        expect(setupUser.mock.calls.map(([input]) => input.isRetry)).toEqual([false, true]);
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it('sends the creation again when the session expires under it', async () => {
        const expired = createPromise<void>();
        const createUser = vi.fn<() => Promise<void>>().mockReturnValueOnce(expired.promise).mockResolvedValueOnce();
        const { actor, ready, signup } = start({ createUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        const creating = signup.createUser();
        await waitFor(actor, (state) => state.matches('creatingUser'));

        // The API makes a new session, then rejects the request sent on the expired one
        actor.send({ type: 'session.expired' });
        expired.reject(new Error('Session expired'));
        await creating;

        expect(createUser).toHaveBeenCalledTimes(2);
        expect(actor.getSnapshot().matches('userCreated')).toBe(true);
    });

    it('sends the setup again when the session expires under it, checking whether its payment went through', async () => {
        const expired = createPromise<SetupUserResult>();
        const setupUser = vi
            .fn<(options: { isRetry: boolean }) => Promise<SetupUserResult>>()
            .mockReturnValueOnce(expired.promise)
            .mockResolvedValueOnce(setupResult);
        const { actor, ready, signup } = start({ setupUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        const settingUp = signup.setupUser();
        await waitFor(actor, (state) => state.matches('settingUpUser'));

        actor.send({ type: 'session.expired' });
        expired.reject(new Error('Session expired'));
        await settingUp;

        expect(setupUser.mock.calls.map(([input]) => input.isRetry)).toEqual([false, true]);
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it('does not send the creation again when the session expires but the creation went through', async () => {
        const created = createPromise<void>();
        const createUser = vi.fn<() => Promise<void>>().mockReturnValueOnce(created.promise);
        const { actor, ready, signup } = start({ createUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        const creating = signup.createUser();
        await waitFor(actor, (state) => state.matches('creatingUser'));

        // Another request on the session expired it, while this one still went through
        actor.send({ type: 'session.expired' });
        expect(createUser).toHaveBeenCalledTimes(1);
        created.resolve();
        await creating;

        expect(createUser).toHaveBeenCalledTimes(1);
        expect(actor.getSnapshot().matches('userCreated')).toBe(true);
    });

    it('does not send the setup again when the session expires but the setup went through', async () => {
        const setUp = createPromise<SetupUserResult>();
        const setupUser = vi
            .fn<(options: { isRetry: boolean }) => Promise<SetupUserResult>>()
            .mockReturnValueOnce(setUp.promise);
        const { actor, ready, signup } = start({ setupUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        const settingUp = signup.setupUser();
        await waitFor(actor, (state) => state.matches('settingUpUser'));

        actor.send({ type: 'session.expired' });
        expect(setupUser).toHaveBeenCalledTimes(1);
        setUp.resolve(setupResult);
        await settingUp;

        expect(setupUser).toHaveBeenCalledTimes(1);
        expect(actor.getSnapshot().matches({ userSetup: 'idle' })).toBe(true);
    });

    it('fails the signup when an operation runs out of order', async () => {
        const { actor, actions, ready, signup } = start();
        await ready();
        await signup.setupUser();
        expect(actor.getSnapshot().matches('failed')).toBe(true);
        expect(actions.reportInvalidStage).toHaveBeenCalledWith(expect.anything(), { operation: 'user.setup' });
        expect(actions.reportErrorPage).toHaveBeenCalledTimes(1);
    });

    it('runs an operation started during another one after it', async () => {
        let finishSending = () => {};
        const sendRecoveryPhrase = () => new Promise<void>((resolve) => (finishSending = resolve));
        const login = vi.fn(async () => {});
        const { actor, ready, signup } = start({ sendRecoveryPhrase, login });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();
        const sending = signup.sendRecoveryPhrasePayload();
        const loggingIn = signup.login();
        await waitFor(actor, (state) => state.matches({ userSetup: 'sendingRecoveryPhrase' }));
        expect(login).not.toHaveBeenCalled();
        finishSending();
        await Promise.all([sending, loggingIn]);
        expect(login).toHaveBeenCalledTimes(1);
    });

    it('keeps the step loading while the page leaves for the app', async () => {
        const { actor, ready, signup } = start({ login: async () => ({ state: 'complete' }) });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await signup.createUser();
        await signup.setupUser();
        const settled = vi.fn();
        void signup.login().then(settled, settled);
        await waitFor(actor, (state) => state.matches({ userSetup: 'leaving' }));
        await new Promise((resolve) => setTimeout(resolve));
        expect(settled).not.toHaveBeenCalled();
    });
});

import { createActor, fromPromise, waitFor } from 'xstate';

import type { ReferralData } from '@proton/shared/lib/interfaces/referral';

import type { OnLoginCallbackResult } from '../../authSession';
import type { AccountData } from '../../signup/interfaces';
import { InvalidReferrerError } from '../helpers/validateReferrer';
import type { SetupUserResult } from './signupActors';
import { createSignupOperations } from './signupOperations';
import { type SignupEmitted, signupStateMachine } from './signupStateMachine';

const accountData = { password: 'password' } as AccountData;
const setupResult = { session: { localID: 1 }, recoveryPhraseData: { payload: {} } } as unknown as SetupUserResult;

const pending = <T>() => new Promise<T>(() => {});

const start = ({
    loadDomains = async () => ['proton.me'],
    checkReferral = async () => undefined,
    initializePayments = async () => {},
    createUser = async () => {},
    setupUser = async () => setupResult,
    sendRecoveryPhrase = async () => {},
    login = async () => {},
}: {
    loadDomains?: () => Promise<string[]>;
    checkReferral?: () => Promise<ReferralData | undefined>;
    initializePayments?: () => Promise<void>;
    createUser?: () => Promise<void>;
    setupUser?: () => Promise<SetupUserResult>;
    sendRecoveryPhrase?: () => Promise<void>;
    login?: () => Promise<OnLoginCallbackResult | void>;
} = {}) => {
    const actions = {
        onReferralCheckError: jest.fn(),
        reportInitialized: jest.fn(),
        reportInitializationError: jest.fn(),
        reportInvalidStage: jest.fn(),
        reportMissingData: jest.fn(),
        reportErrorPage: jest.fn(),
    };
    const emitted: SignupEmitted[] = [];
    const actor = createActor(
        signupStateMachine.provide({
            actors: {
                startAuth: fromPromise(async () => {}),
                loadDomains: fromPromise(loadDomains),
                checkReferral: fromPromise(checkReferral),
                initializePayments: fromPromise(initializePayments),
                createUser: fromPromise(createUser),
                setupUser: fromPromise(setupUser),
                setupSubscription: fromPromise(async () => {}),
                setOrgName: fromPromise(async () => {}),
                setDisplayName: fromPromise(async () => {}),
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
        expect(context).toMatchObject({ domains: ['proton.me'], domainsLoaded: true });
        expect(actions.reportInitialized).toHaveBeenCalledTimes(1);
    });

    it('shows a failed initialization once and still lets the user sign up', async () => {
        const error = new Error('offline');
        const { actions, emitted, ready } = start({
            loadDomains: () => Promise.reject(error),
            initializePayments: () => Promise.reject(error),
        });
        const { context } = await ready();
        expect(emitted).toEqual([{ type: 'error', error }]);
        expect(actions.reportInitializationError).toHaveBeenCalledTimes(1);
        expect(actions.reportInitialized).not.toHaveBeenCalled();
        expect(context.domainsLoaded).toBe(true);
    });

    it('leaves an unknown referrer to the flow', async () => {
        const { actions, emitted, ready } = start({ checkReferral: () => Promise.reject(new InvalidReferrerError()) });
        await ready();
        expect(actions.onReferralCheckError).toHaveBeenCalledTimes(1);
        expect(emitted).toEqual([]);
        expect(actions.reportInitialized).not.toHaveBeenCalled();
    });

    it('does not create a user before the signup is ready or without account data', async () => {
        const createUser = jest.fn(async () => {});
        const initializing = start({ loadDomains: () => pending<string[]>(), createUser });
        initializing.actor.send({ type: 'account.submitted', accountData });
        await initializing.signup.createUser();
        expect(initializing.actor.getSnapshot().matches('initializing')).toBe(true);

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
        const login = jest.fn(async () => {});
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
        const createUser = jest.fn<Promise<void>, []>().mockRejectedValueOnce(error).mockResolvedValueOnce();
        const { actor, ready, signup } = start({ createUser });
        await ready();
        actor.send({ type: 'account.submitted', accountData });
        await expect(signup.createUser()).rejects.toBe(error);
        expect(actor.getSnapshot().matches('ready')).toBe(true);
        await signup.createUser();
        expect(actor.getSnapshot().matches('userCreated')).toBe(true);
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
        const login = jest.fn(async () => {});
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
        const settled = jest.fn();
        void signup.login().then(settled, settled);
        await waitFor(actor, (state) => state.matches({ userSetup: 'leaving' }));
        await new Promise((resolve) => setTimeout(resolve));
        expect(settled).not.toHaveBeenCalled();
    });
});

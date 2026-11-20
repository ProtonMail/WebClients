/**
 * What every signupCtx flow shares: loads what the signup needs, then creates the user, sets it up and signs it in.
 * The flows drive it in that order through `createSignupOperations`. `createSignupActors` provides the actors.
 */
import { assertEvent, assign, emit, setup } from 'xstate';

import type { ReferralData } from '@proton/shared/lib/interfaces/referral';

import {
    errorOf,
    isErrorOf,
    reportActorError,
    unprovidedAction,
    unprovidedActors,
} from '../../sign-in/state-machine/machineHelpers';
import { getOptimisticDomains } from '../../signup/helper';
import type { AccountData } from '../../signup/interfaces';
import type { SignupContextSubscriptionData } from '../context/helpers/handleSetupUser';
import { InvalidReferrerError } from '../helpers/validateReferrer';
import type { SetupUserResult, SignupActors } from './signupActors';

export type SignupEvent =
    | { type: 'account.submitted'; accountData: AccountData }
    | { type: 'payment.submitted'; subscriptionData: SignupContextSubscriptionData }
    | { type: 'user.create' }
    | { type: 'user.setup'; reservation?: boolean }
    | { type: 'subscription.setup' }
    | { type: 'orgName.set'; orgName: string }
    | { type: 'displayName.set'; displayName: string }
    | { type: 'password.set'; password: string }
    | { type: 'recoveryPhrase.send' }
    | { type: 'login' }
    /** From `watchSession`: the unauthenticated session expired, taking the requests sent on it. */
    | { type: 'session.expired' };

export type SignupEmitted = { type: 'error'; error: unknown };

interface SignupContext {
    domains: string[];
    /** The domains request finished, successfully or not: the availability checks wait for it. */
    domainsLoaded: boolean;
    referralData: ReferralData | undefined;
    initializationFailed: boolean;
    accountData: AccountData | undefined;
    /** What the user was created with: submitting the same account again only retries its setup. */
    createdAccountData: AccountData | undefined;
    subscriptionData: SignupContextSubscriptionData | undefined;
    setupResult: SetupUserResult | undefined;
    /** Set up on the free plan to pay once signed in: its account creation is reported with the subscription. */
    reservation: boolean;
    /** A setup failed, maybe after its payment went through: the next one checks before subscribing. */
    setupFailed: boolean;
    /**
     * The session expired while the user was created or set up. Any request on the session can expire it, so the
     * operation is only sent again once its own attempt fails: two attempts never run at the same time.
     */
    sessionExpired: boolean;
    /** Why the last operation failed. A new object per failure, so `createSignupOperations` can tell them apart. */
    failure: { error: unknown } | undefined;
}

/** The same account: the challenge payload changes with every submit, the rest is what the user typed. */
const isSameAccount = (a: AccountData | undefined, b: AccountData | undefined) =>
    !!a &&
    !!b &&
    a.signupType === b.signupType &&
    a.email === b.email &&
    a.username === b.username &&
    a.domain === b.domain &&
    a.password === b.password;

/** Keeps why an operation failed, for `createSignupOperations` to hand to the flow. */
const assignFailure = {
    type: 'assignFailure' as const,
    params: ({ event }: { event: { error: unknown } }) => ({ error: event.error }),
};

/** Once the user is set up, or once a reservation pays: with the plan the user signs up for. */
const reportAccountCreation = {
    type: 'reportAccountCreation' as const,
    params: ({ context }: { context: SignupContext }) => ({
        accountData: context.accountData,
        subscriptionData: context.subscriptionData,
    }),
};

/** A subscription paid after the setup. */
const reportLaterSubscription = {
    type: 'reportSubscription' as const,
    params: ({ context, event }: { context: SignupContext; event: { output: SetupUserResult['subscription'] } }) => ({
        subscriptionData: context.subscriptionData,
        subscription: event.output,
        user: context.setupResult?.user,
    }),
};

/** One request of the initialization: a failure doesn't stop the others, and the first one is reported. */
const onInitializationError = [
    {
        guard: errorOf(InvalidReferrerError),
        target: 'done' as const,
        actions: ['markInitializationFailed' as const, 'onReferralCheckError' as const],
    },
    { guard: 'hasInitializationFailed' as const, target: 'done' as const },
    {
        target: 'done' as const,
        actions: [
            'markInitializationFailed' as const,
            reportActorError,
            {
                type: 'reportInitializationError' as const,
                params: ({ event }: { event: { error: unknown } }) => ({ error: event.error }),
            },
        ],
    },
];

/** An operation the current state doesn't take, which is a bug in the flow. */
const invalidStage = {
    target: '#signup.failed' as const,
    actions: {
        type: 'reportInvalidStage' as const,
        params: ({ event }: { event: SignupEvent }) => ({ operation: event.type }),
    },
};

export const signupStateMachine = setup({
    types: {
        context: {} as SignupContext,
        events: {} as SignupEvent,
        emitted: {} as SignupEmitted,
        tags: {} as 'busy',
    },
    actors: unprovidedActors<SignupActors>({
        watchSession: true,
        startAuth: true,
        loadDomains: true,
        checkReferral: true,
        initializePayments: true,
        createUser: true,
        setupUser: true,
        setupSubscription: true,
        setPassword: true,
        setOrgName: true,
        setDisplayName: true,
        sendRecoveryPhrase: true,
        login: true,
    }),
    actions: {
        assignAccountData: assign((_, { accountData }: { accountData: AccountData }) => ({ accountData })),
        assignCreatedAccountData: assign(({ context }) => ({ createdAccountData: context.accountData })),
        assignPaymentData: assign((_, { subscriptionData }: { subscriptionData: SignupContextSubscriptionData }) => ({
            subscriptionData,
        })),
        assignDomains: assign((_, { domains }: { domains: string[] }) => ({ domains })),
        markDomainsLoaded: assign({ domainsLoaded: true }),
        assignReferralData: assign((_, { referralData }: { referralData: ReferralData | undefined }) => ({
            referralData,
        })),
        assignSetupResult: assign((_, { setupResult }: { setupResult: SetupUserResult }) => ({ setupResult })),
        assignReservation: assign((_, { reservation }: { reservation: boolean }) => ({ reservation })),
        assignFailure: assign((_, { error }: { error: unknown }) => ({ failure: { error } })),
        markInitializationFailed: assign({ initializationFailed: true }),
        markSetupFailed: assign({ setupFailed: true }),
        markSessionExpired: assign({ sessionExpired: true }),
        clearSessionExpired: assign({ sessionExpired: false }),
        /** Hands the error to the page to show. */
        reportError: emit((_, { error }: { error: unknown }) => ({ type: 'error' as const, error })),
        onReferralCheckError: () => unprovidedAction('onReferralCheckError'),
        reportInitialized: () => unprovidedAction('reportInitialized'),
        reportInitializationError: (_, _params: { error: unknown }) => unprovidedAction('reportInitializationError'),
        reportInvalidStage: (_, _params: { operation: SignupEvent['type'] }) => unprovidedAction('reportInvalidStage'),
        reportMissingData: (_, _params: { operation: SignupEvent['type']; message: string }) =>
            unprovidedAction('reportMissingData'),
        reportErrorPage: () => unprovidedAction('reportErrorPage'),
        reportAccountCreation: (
            _,
            _params: {
                accountData: AccountData | undefined;
                subscriptionData: SignupContextSubscriptionData | undefined;
            }
        ) => unprovidedAction('reportAccountCreation'),
        reportSubscription: (
            _,
            _params: {
                subscriptionData: SignupContextSubscriptionData | undefined;
                subscription: SetupUserResult['subscription'];
                user: SetupUserResult['user'] | undefined;
            }
        ) => unprovidedAction('reportSubscription'),
    },
    guards: {
        isErrorOf,
        isReservation: ({ context }) => context.reservation,
        hasInitializationFailed: ({ context }) => context.initializationFailed,
        hasAccountData: ({ context }) => !!context.accountData,
        hasSessionExpired: ({ context }) => context.sessionExpired,
        isCreatedAccount: ({ context }) => isSameAccount(context.accountData, context.createdAccountData),
        hasRecoveryPhrase: ({ context }) => !!context.setupResult?.recoveryPhraseData,
        isLeavingForApp: (_, { state }: { state: string | undefined }) => state === 'complete',
    },
}).createMachine({
    id: 'signup',
    initial: 'initializing',
    context: () => ({
        domains: getOptimisticDomains(),
        domainsLoaded: false,
        referralData: undefined,
        initializationFailed: false,
        accountData: undefined,
        createdAccountData: undefined,
        subscriptionData: undefined,
        setupResult: undefined,
        reservation: false,
        setupFailed: false,
        sessionExpired: false,
        failure: undefined,
    }),
    on: {
        'account.submitted': {
            actions: { type: 'assignAccountData', params: ({ event }) => ({ accountData: event.accountData }) },
        },
        'payment.submitted': {
            actions: {
                type: 'assignPaymentData',
                params: ({ event }) => ({ subscriptionData: event.subscriptionData }),
            },
        },
        'user.create': invalidStage,
        'user.setup': invalidStage,
        'subscription.setup': invalidStage,
        'orgName.set': invalidStage,
        'displayName.set': invalidStage,
        'password.set': invalidStage,
        'recoveryPhrase.send': invalidStage,
        login: invalidStage,
    },
    invoke: { src: 'watchSession' },
    states: {
        initializing: {
            initial: 'startingAuth',
            states: {
                // The requests need the auth session, but a failure here surfaces through them
                startingAuth: { invoke: { src: 'startAuth', onDone: 'loading', onError: 'loading' } },
                loading: {
                    type: 'parallel',
                    states: {
                        domains: {
                            initial: 'loading',
                            states: {
                                loading: {
                                    invoke: {
                                        src: 'loadDomains',
                                        onDone: {
                                            target: 'done',
                                            actions: {
                                                type: 'assignDomains',
                                                params: ({ event }) => ({ domains: event.output }),
                                            },
                                        },
                                        onError: onInitializationError,
                                    },
                                },
                                done: { type: 'final', entry: 'markDomainsLoaded' },
                            },
                        },
                        referral: {
                            initial: 'checking',
                            states: {
                                checking: {
                                    invoke: {
                                        src: 'checkReferral',
                                        onDone: {
                                            target: 'done',
                                            actions: {
                                                type: 'assignReferralData',
                                                params: ({ event }) => ({ referralData: event.output }),
                                            },
                                        },
                                        onError: onInitializationError,
                                    },
                                },
                                done: { type: 'final' },
                            },
                        },
                        payments: {
                            initial: 'initializing',
                            states: {
                                initializing: {
                                    invoke: {
                                        src: 'initializePayments',
                                        onDone: 'done',
                                        onError: onInitializationError,
                                    },
                                },
                                done: { type: 'final' },
                            },
                        },
                    },
                    onDone: [
                        { guard: 'hasInitializationFailed', target: '#signup.ready' },
                        { target: '#signup.ready', actions: 'reportInitialized' },
                    ],
                },
            },
        },
        ready: {
            on: {
                'user.create': [
                    { guard: 'hasAccountData', target: 'creatingUser' },
                    {
                        actions: {
                            type: 'reportMissingData',
                            params: { operation: 'user.create', message: 'Missing accountData' },
                        },
                    },
                ],
            },
        },
        creatingUser: {
            tags: 'busy',
            entry: 'clearSessionExpired',
            invoke: {
                src: 'createUser',
                input: ({ context }) => ({
                    accountData: context.accountData,
                    subscriptionData: context.subscriptionData,
                }),
                onDone: { target: 'userCreated', actions: 'assignCreatedAccountData' },
                onError: [
                    // A refused creation created nothing: it has all it needs to be sent again on the new session
                    { guard: 'hasSessionExpired', target: 'creatingUser', reenter: true },
                    { target: 'ready', actions: assignFailure },
                ],
            },
            on: { 'session.expired': { actions: 'markSessionExpired' } },
        },
        userCreated: {
            on: {
                'user.setup': {
                    target: 'settingUpUser',
                    actions: {
                        type: 'assignReservation',
                        params: ({ event }) => ({ reservation: !!event.reservation }),
                    },
                },
                // The setup failed and the user submitted the form again: the same account is already created and
                // the flow's setupUser() retries its setup, another one is created
                'user.create': [{ guard: 'isCreatedAccount' }, { target: 'creatingUser' }],
            },
        },
        settingUpUser: {
            tags: 'busy',
            entry: 'clearSessionExpired',
            invoke: {
                src: 'setupUser',
                input: ({ context }) => ({
                    accountData: context.accountData,
                    subscriptionData: context.subscriptionData,
                    referralData: context.referralData,
                    isRetry: context.setupFailed,
                }),
                onDone: [
                    // A reservation is set up on the free plan: its account creation is reported once it pays
                    {
                        guard: 'isReservation',
                        target: 'userSetup',
                        actions: { type: 'assignSetupResult', params: ({ event }) => ({ setupResult: event.output }) },
                    },
                    {
                        target: 'userSetup',
                        actions: [
                            { type: 'assignSetupResult', params: ({ event }) => ({ setupResult: event.output }) },
                            reportAccountCreation,
                            {
                                type: 'reportSubscription',
                                params: ({ context, event }) => ({
                                    subscriptionData: context.subscriptionData,
                                    subscription: event.output.subscription,
                                    user: event.output.user,
                                }),
                            },
                        ],
                    },
                ],
                onError: [
                    // The setup signs in again with the account's credentials, and checks a payment didn't already go through
                    { guard: 'hasSessionExpired', target: 'settingUpUser', reenter: true, actions: 'markSetupFailed' },
                    { target: 'userCreated', actions: [assignFailure, 'markSetupFailed'] },
                ],
            },
            on: { 'session.expired': { actions: 'markSessionExpired' } },
        },
        userSetup: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        'subscription.setup': 'settingUpSubscription',
                        'orgName.set': 'settingOrgName',
                        'displayName.set': 'settingDisplayName',
                        'password.set': 'settingPassword',
                        'recoveryPhrase.send': [
                            { guard: 'hasRecoveryPhrase', target: 'sendingRecoveryPhrase' },
                            {
                                actions: {
                                    type: 'reportMissingData',
                                    params: {
                                        operation: 'recoveryPhrase.send',
                                        message: 'Missing recovery phrase data',
                                    },
                                },
                            },
                        ],
                        login: 'loggingIn',
                    },
                },
                settingUpSubscription: {
                    tags: 'busy',
                    invoke: {
                        src: 'setupSubscription',
                        input: ({ context }) => ({
                            subscriptionData: context.subscriptionData,
                            setupResult: context.setupResult,
                        }),
                        onDone: [
                            {
                                guard: 'isReservation',
                                target: 'idle',
                                actions: [reportAccountCreation, reportLaterSubscription],
                            },
                            { target: 'idle', actions: reportLaterSubscription },
                        ],
                        onError: { target: 'idle', actions: assignFailure },
                    },
                },
                settingOrgName: {
                    tags: 'busy',
                    invoke: {
                        src: 'setOrgName',
                        input: ({ context, event }) => {
                            assertEvent(event, 'orgName.set');
                            return {
                                orgName: event.orgName,
                                accountData: context.accountData,
                                setupResult: context.setupResult,
                            };
                        },
                        onDone: 'idle',
                        onError: { target: 'idle', actions: assignFailure },
                    },
                },
                settingDisplayName: {
                    tags: 'busy',
                    invoke: {
                        src: 'setDisplayName',
                        input: ({ event }) => {
                            assertEvent(event, 'displayName.set');
                            return { displayName: event.displayName };
                        },
                        onDone: 'idle',
                        onError: { target: 'idle', actions: assignFailure },
                    },
                },
                settingPassword: {
                    tags: 'busy',
                    invoke: {
                        src: 'setPassword',
                        input: ({ context, event }) => {
                            assertEvent(event, 'password.set');
                            return {
                                password: event.password,
                                accountData: context.accountData,
                                setupResult: context.setupResult,
                            };
                        },
                        onDone: {
                            target: 'idle',
                            actions: [
                                {
                                    type: 'assignAccountData',
                                    params: ({ event }) => ({ accountData: event.output.accountData }),
                                },
                                {
                                    type: 'assignSetupResult',
                                    params: ({ event }) => ({ setupResult: event.output.setupResult }),
                                },
                            ],
                        },
                        onError: { target: 'idle', actions: assignFailure },
                    },
                },
                sendingRecoveryPhrase: {
                    tags: 'busy',
                    invoke: {
                        src: 'sendRecoveryPhrase',
                        input: ({ context }) => ({
                            accountData: context.accountData,
                            setupResult: context.setupResult,
                        }),
                        onDone: 'idle',
                        onError: { target: 'idle', actions: assignFailure },
                    },
                },
                loggingIn: {
                    tags: 'busy',
                    invoke: {
                        src: 'login',
                        input: ({ context }) => ({
                            accountData: context.accountData,
                            setupResult: context.setupResult,
                        }),
                        onDone: [
                            {
                                guard: {
                                    type: 'isLeavingForApp',
                                    params: ({ event }) => ({ state: event.output?.state }),
                                },
                                target: 'leaving',
                            },
                            { target: 'idle' },
                        ],
                        onError: { target: 'idle', actions: assignFailure },
                    },
                },
                // The page is leaving for the app: the step stays loading until it unloads
                leaving: { tags: 'busy' },
            },
        },
        failed: {
            entry: 'reportErrorPage',
            // Nothing recovers the signup: the error page asks to reload
            type: 'final',
        },
    },
});

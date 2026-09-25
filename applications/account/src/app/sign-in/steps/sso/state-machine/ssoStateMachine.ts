/**
 * The SSO account flow: after an SSO sign-in, the sign-in machine runs this as a child with the auth state. It loads
 * the account and signs in directly when the device can unlock the keys; otherwise the SSO steps: device approval,
 * the backup password and key setup. It completes the sign-in itself and ends with a result.
 * Each screen sets `screen`; the work states keep it, so the screen stays up while a request runs. Capabilities
 * from the SSO intent decide which ways out exist.
 */
import {
    type EventObject,
    type SnapshotFrom,
    and,
    assertEvent,
    assign,
    fromCallback,
    sendParent,
    setup,
    spawnChild,
} from 'xstate';

import type { DeviceSecretUser } from '@proton/shared/lib/keys/device';

import type { AuthSession } from '../../../../content/authSession';
import { type SSODataTypes, SSOLoginCapabilites } from '../../../auth/interface';
import {
    type PrepareSSOResult,
    type SSOSignInResult,
    getBackupPasswordDisabled,
    getFirstLoginAfterConversion,
} from '../../../auth/sso';
import {
    ACCOUNT_FLOW_FAILED,
    type AccountFlowInput,
    type AccountFlowResult,
    failAccountFlow,
    retryOnWrongPassword,
} from '../../../state-machine/accountFlow';
import {
    type StepErrorEvent,
    isErrorOf,
    reportActorError,
    unprovidedActors,
} from '../../../state-machine/machineHelpers';
import type { SignInAuthState } from '../../../state-machine/signInAuthState';
import { getJoinOrganization } from './joinOrganization';
import type { SSOActors } from './ssoActors';

export type SSOScreen =
    | 'setupKeys'
    | 'otherDevices'
    | 'askAdmin'
    | 'adminConfirmationCode'
    | 'backupPassword'
    | 'firstLoginAfterConversion'
    | 'rejected'
    | 'adminGranted'
    | 'newBackupPassword';

/** Sent by `waitForDeviceApproval` when another device or an administrator answers the sign-in request. */
export type SSODeviceEvent =
    | { type: 'sso.device.approved'; payload: { deviceSecretUser: DeviceSecretUser } }
    | { type: 'sso.device.rejected' }
    /** The sign-in's session ended (a 401 its refresh couldn't fix) or was refused (a 403): the attempt ends. */
    | { type: 'sso.device.failed'; error: unknown };

type SSOEvent =
    | { type: 'sso.setup.submitted'; payload: { password: string | null } }
    | { type: 'sso.backupPassword.requested' }
    | { type: 'sso.backupPassword.submitted'; payload: { password: string } }
    | { type: 'sso.adminHelp.requested' }
    | { type: 'sso.adminHelp.confirmed' }
    | { type: 'sso.continued' }
    | { type: 'sso.newBackupPassword.submitted'; payload: { password: string | null } }
    | SSODeviceEvent
    | { type: 'decision.back' };

export enum SSOStateMachineTags {
    /** A request runs; the current screen shows its loading state. */
    submitting = 'submitting',
}

interface SSOMachineContext {
    auth: SignInAuthState;
    /** What the member's device and organization need for the SSO sign-in; loaded while preparing. */
    ssoData: SSODataTypes | undefined;
    screen: SSOScreen | undefined;
    /** A session from an approved device or the backup password, held while a temporary password is replaced. */
    session: AuthSession | undefined;
    /** The administrator got the request; asking again goes back to waiting for their approval. */
    adminApprovalRequested: boolean;
    result: AccountFlowResult | undefined;
}

/** The input of the actors that work with the SSO data; they check it's there (see `ssoActors`). */
export interface SSOInput extends AccountFlowInput {
    ssoData: SSODataTypes | undefined;
}

export interface ChangeBackupPasswordInput extends SSOInput {
    /** The session from an approved device, for members who still have a temporary password. */
    session: AuthSession | undefined;
    /** Null when the organization disabled the backup password. */
    password: string | null;
}

type SSOLogo = SSODataTypes['organizationData']['logo'];

/**
 * Holds the organization logo loaded with the SSO data and frees its object URL when the SSO steps stop, however they
 * end: signed in, cancelled, failed, or the page unmounting.
 */
const holdSSOLogo = fromCallback<EventObject, SSOLogo>(
    ({ input }) =>
        () =>
            input?.cleanup()
);

const canAskAdmin = { type: 'hasSSOCapability' as const, params: { capability: SSOLoginCapabilites.ASK_ADMIN } };
const canUseBackupPassword = {
    type: 'hasSSOCapability' as const,
    params: { capability: SSOLoginCapabilites.ENTER_BACKUP_PASSWORD },
};

/**
 * While a request that may sign in runs, the machine ignores the screen's ways out: by then the request can have
 * activated the device and persisted a session, which leaving would drop.
 */
const blockWaysOut = { 'decision.back': {}, 'sso.adminHelp.requested': {}, 'sso.backupPassword.requested': {} };

/** Back from an SSO screen returns to where the member could choose it, or leaves the SSO steps. */
const backWithinSSO = [
    {
        guard: { type: 'hasSSOCapability' as const, params: { capability: SSOLoginCapabilites.OTHER_DEVICES } },
        target: '#sso.waysIn.otherDevices',
    },
    {
        guard: {
            type: 'hasSSOCapability' as const,
            params: { capability: SSOLoginCapabilites.FIRST_LOGIN_AFTER_CONVERSION },
        },
        target: '#sso.waysIn.firstLoginAfterConversion',
    },
    { target: '#sso.cancelled' },
];

/** Asking the administrator for help, when allowed; once they got the request, it waits for their approval again. */
const askAdminHelp = [
    { guard: and([canAskAdmin, 'hasRequestedAdminApproval' as const]), target: '#sso.waysIn.adminConfirmationCode' },
    { guard: canAskAdmin, target: '#sso.waysIn.askAdmin' },
];

const toBackupPassword = { guard: canUseBackupPassword, target: '#sso.backupPassword' };

/**
 * After an approval or the backup password, `routeSession` decides either way: a member with a temporary password sets a
 * new backup password before any session exists.
 */
const routeSignInResult = {
    target: '#sso.routeSession',
    actions: {
        type: 'setSignInResult' as const,
        params: ({ event }: { event: { output: SSOSignInResult } }) => ({ result: event.output }),
    },
};

/** The first screen's state for each intent; any other intent asks for the backup password. */
const ssoScreenByIntent: [SSOLoginCapabilites, string][] = [
    [SSOLoginCapabilites.SETUP_BACKUP_PASSWORD, 'setupKeys'],
    [SSOLoginCapabilites.SETUP_WITHOUT_BACKUP_PASSWORD, 'setupKeys'],
    [SSOLoginCapabilites.OTHER_DEVICES, 'waysIn.otherDevices'],
    [SSOLoginCapabilites.ASK_ADMIN, 'waysIn.askAdmin'],
    [SSOLoginCapabilites.FIRST_LOGIN_AFTER_CONVERSION, 'waysIn.firstLoginAfterConversion'],
    [SSOLoginCapabilites.NEW_BACKUP_PASSWORD, 'newBackupPassword'],
    [SSOLoginCapabilites.NEW_BACKUP_PASSWORD_DISABLED, 'newBackupPassword'],
];

const hasCapability = (context: SSOMachineContext, capability: SSOLoginCapabilites) =>
    !!context.ssoData?.intent.capabilities.has(capability);

/**
 * Whether the screens offer a way out: the same capability its transition checks. Not `snapshot.can`, which is false
 * while a request runs and the machine ignores the ways out, but the buttons stay.
 */
export const selectHasSSOCapability =
    (capability: SSOLoginCapabilites) =>
    ({ context }: { context: SSOMachineContext }) =>
        hasCapability(context, capability);

/** Derived from the flow's auth state; the guards use them, and the screens through `useSelector`. */
export const selectBackupPasswordDisabled = ({ context }: { context: SSOMachineContext }) =>
    getBackupPasswordDisabled(context.auth.credentials.authResponse);

export const selectSSOData = ({ context }: { context: SSOMachineContext }) => context.ssoData;

/** The organization the member joins and the name they join as; select it with `shallowEqual`. */
export const selectJoinOrganization = ({ context }: { context: SSOMachineContext }) =>
    getJoinOrganization(context.ssoData, context.auth.account.user);

export const selectFirstLoginAfterConversion = ({ context }: { context: SSOMachineContext }) =>
    getFirstLoginAfterConversion(context.auth.credentials.authResponse);

const ssoSetup = setup({
    types: {
        context: {} as SSOMachineContext,
        events: {} as SSOEvent,
        input: {} as AccountFlowInput,
        output: {} as AccountFlowResult,
        tags: {} as `${SSOStateMachineTags}`,
        children: {} as { ssoLogo: 'holdSSOLogo' },
    },
    actors: {
        ...unprovidedActors<SSOActors>({
            loadAccount: true,
            completeSignIn: true,
            prepareSSO: true,
            waitForDeviceApproval: true,
            confirmSSODevice: true,
            requestAdminApproval: true,
            unlockWithBackupPassword: true,
            setupSSOKeys: true,
            changeBackupPassword: true,
        }),
        holdSSOLogo,
    },
    actions: {
        setScreen: assign((_, params: { screen: SSOScreen }) => ({ screen: params.screen })),
        setSession: assign((_, params: { session: AuthSession }) => ({ session: params.session })),
        /** What preparing found: a session when the device can unlock the keys, otherwise the SSO data. */
        setPrepared: assign(({ context }, params: { result: PrepareSSOResult }) =>
            params.result.type === 'session'
                ? { session: params.result.session }
                : {
                      ssoData: params.result.ssoData,
                      auth: {
                          ...context.auth,
                          account: {
                              ...context.auth.account,
                              addresses:
                                  'addresses' in params.result.ssoData
                                      ? params.result.ssoData.addresses
                                      : context.auth.account.addresses,
                          },
                      },
                  }
        ),
        /** The session, or the data (and fresh user) to set a new backup password first (see `SSOSignInResult`). */
        setSignInResult: assign(({ context }, params: { result: SSOSignInResult }) =>
            params.result.type === 'session'
                ? { session: params.result.session }
                : {
                      ssoData: params.result.ssoData,
                      auth: { ...context.auth, account: { ...context.auth.account, user: params.result.user } },
                  }
        ),
        markAdminApprovalRequested: assign({ adminApprovalRequested: true }),
        setResult: assign((_, params: { result: AccountFlowResult }) => ({ result: params.result })),
        setAccount: assign(({ context }, params: { account: Partial<SignInAuthState['account']> }) => ({
            auth: { ...context.auth, account: { ...context.auth.account, ...params.account } },
        })),
        reportError: sendParent((_, params: { error: unknown }): StepErrorEvent => ({
            type: 'step.errorReported',
            payload: { error: params.error },
        })),
    },
    guards: {
        isErrorOf,
        isSSOIntent: ({ context }, params: { step: SSOLoginCapabilites }) =>
            context.ssoData?.intent.step === params.step,
        hasSSOCapability: ({ context }, params: { capability: SSOLoginCapabilites }) =>
            hasCapability(context, params.capability),
        isPreparedSession: (_, params: { result: PrepareSSOResult }) => params.result.type === 'session',
        hasRequestedAdminApproval: ({ context }) => context.adminApprovalRequested,
        isSSOBackupPasswordDisabled: ({ context }) => selectBackupPasswordDisabled({ context }),
        /** An approved member must still replace the temporary password, before or (defensively) after a session. */
        isTemporaryPasswordSession: ({ context }) =>
            context.ssoData?.type === 'set-password' || !!context.session?.data.User.Flags['has-temporary-password'],
    },
});

/** A screen that waits for another device or an administrator to approve the sign-in, polling until they answer. */
const waitForApproval = ssoSetup.createStateConfig({
    initial: 'polling',
    states: {
        polling: {
            invoke: {
                src: 'waitForDeviceApproval',
                input: ({ context }) => ({ auth: context.auth }),
                onError: failAccountFlow,
            },
            on: {
                'sso.device.approved': { target: 'confirming' },
                'sso.device.rejected': { target: '#sso.rejected' },
                'sso.device.failed': failAccountFlow,
            },
        },
        /** Signs in with the approved device; the screen stays, and its ways out are ignored. */
        confirming: {
            tags: [SSOStateMachineTags.submitting],
            on: blockWaysOut,
            invoke: {
                src: 'confirmSSODevice',
                input: ({ context, event }) => {
                    assertEvent(event, 'sso.device.approved');
                    return {
                        auth: context.auth,
                        ssoData: context.ssoData,
                        deviceSecretUser: event.payload.deviceSecretUser,
                    };
                },
                onDone: routeSignInResult,
                // Without polling again, like main: the next poll would find the same approval and fail the same way
                onError: { target: 'confirmationFailed', actions: reportActorError },
            },
        },
        /** The approval came, but confirming this device failed; the error shows and polling stays stopped. */
        confirmationFailed: {},
    },
});

export const ssoStateMachine = ssoSetup.createMachine({
    id: 'sso',
    initial: 'loadingAccount',
    context: ({ input }) => ({
        auth: input.auth,
        ssoData: undefined,
        screen: undefined,
        session: undefined,
        adminApprovalRequested: false,
        result: undefined,
    }),
    output: ({ context }) => context.result ?? { type: 'cancelled' },
    on: {
        'decision.back': { target: '.cancelled' },
    },
    states: {
        loadingAccount: {
            tags: [SSOStateMachineTags.submitting],
            invoke: {
                src: 'loadAccount',
                onDone: {
                    target: 'preparing',
                    actions: { type: 'setAccount', params: ({ event }) => ({ account: event.output }) },
                },
                onError: failAccountFlow,
            },
        },
        preparing: {
            tags: [SSOStateMachineTags.submitting],
            invoke: {
                src: 'prepareSSO',
                input: ({ context }) => ({ auth: context.auth }),
                onDone: [
                    {
                        guard: { type: 'isPreparedSession', params: ({ event }) => ({ result: event.output }) },
                        target: 'completing',
                        actions: { type: 'setPrepared', params: ({ event }) => ({ result: event.output }) },
                    },
                    {
                        target: 'routeIntent',
                        actions: [
                            { type: 'setPrepared', params: ({ event }) => ({ result: event.output }) },
                            spawnChild('holdSSOLogo', {
                                id: 'ssoLogo',
                                input: ({ context }) => context.ssoData?.organizationData.logo ?? null,
                            }),
                        ],
                    },
                ],
                onError: failAccountFlow,
            },
        },

        routeIntent: {
            always: [
                ...ssoScreenByIntent.map(([step, target]) => ({
                    guard: { type: 'isSSOIntent' as const, params: { step } },
                    target,
                })),
                { target: 'backupPassword' },
            ],
        },

        /** First sign-in of a member without keys: set them up, with a backup password unless disabled. */
        setupKeys: {
            entry: { type: 'setScreen', params: { screen: 'setupKeys' } },
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        'sso.setup.submitted': { target: 'submitting' },
                    },
                },
                submitting: {
                    tags: [SSOStateMachineTags.submitting],
                    on: blockWaysOut,
                    invoke: {
                        src: 'setupSSOKeys',
                        input: ({ context, event }) => {
                            assertEvent(event, 'sso.setup.submitted');
                            return {
                                auth: context.auth,
                                ssoData: context.ssoData,
                                password: event.payload.password,
                            };
                        },
                        onDone: {
                            target: '#sso.routeSession',
                            actions: [
                                { type: 'setSession', params: ({ event }) => ({ session: event.output }) },
                                // The keys were just created: the session has the fresh user, and the addresses now
                                // have keys, so they're loaded again when needed (a member with a temporary
                                // password still changes the backup password next, with the new keys)
                                {
                                    type: 'setAccount',
                                    params: ({ event }) => ({
                                        account: { user: event.output.data.User, addresses: undefined },
                                    }),
                                },
                            ],
                        },
                        onError: failAccountFlow,
                    },
                },
            },
        },

        /**
         * The screens that offer the ways in: another device, the administrator, and after a conversion the old
         * password. Back from the backup password returns to the last one the member saw.
         */
        waysIn: {
            initial: 'leaving',
            states: {
                /** Approve the sign-in from another signed-in device. */
                otherDevices: {
                    entry: { type: 'setScreen', params: { screen: 'otherDevices' } },
                    ...waitForApproval,
                    on: {
                        'sso.backupPassword.requested': toBackupPassword,
                        'sso.adminHelp.requested': askAdminHelp,
                    },
                },

                askAdmin: {
                    entry: { type: 'setScreen', params: { screen: 'askAdmin' } },
                    initial: 'idle',
                    states: {
                        idle: {
                            on: {
                                'sso.adminHelp.confirmed': { target: 'requesting' },
                            },
                        },
                        /**
                         * The request signs out the member's other devices. The ways out are ignored meanwhile, like the
                         * other requests that change the account: leaving would forget it was sent, and asking again would
                         * send it twice.
                         */
                        requesting: {
                            tags: [SSOStateMachineTags.submitting],
                            on: blockWaysOut,
                            invoke: {
                                src: 'requestAdminApproval',
                                input: ({ context }) => ({ auth: context.auth, ssoData: context.ssoData }),
                                onDone: {
                                    target: '#sso.waysIn.adminConfirmationCode',
                                    actions: 'markAdminApprovalRequested',
                                },
                                onError: { target: 'idle', actions: reportActorError },
                            },
                        },
                    },
                    on: {
                        'sso.backupPassword.requested': toBackupPassword,
                        'decision.back': backWithinSSO,
                    },
                },
                /** The administrator got the request; share the confirmation code and wait for the approval. */
                adminConfirmationCode: {
                    entry: { type: 'setScreen', params: { screen: 'adminConfirmationCode' } },
                    ...waitForApproval,
                    on: {
                        'sso.backupPassword.requested': toBackupPassword,
                        'decision.back': backWithinSSO,
                    },
                },

                /** A member converted to SSO signs in for the first time; their old password is the backup password. */
                firstLoginAfterConversion: {
                    entry: { type: 'setScreen', params: { screen: 'firstLoginAfterConversion' } },
                    on: {
                        'sso.continued': { target: '#sso.backupPassword' },
                    },
                },

                /** The last screen shown here, or else `leaving`. */
                previous: { type: 'history', target: 'leaving' },
                /** Back from a backup password the member didn't open from here leaves the SSO steps. */
                leaving: { always: { target: '#sso.cancelled' } },
            },
        },

        rejected: {
            entry: { type: 'setScreen', params: { screen: 'rejected' } },
        },

        backupPassword: {
            entry: { type: 'setScreen', params: { screen: 'backupPassword' } },
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        'sso.backupPassword.submitted': { target: 'unlocking' },
                    },
                },
                /** The screen stays, and its ways out are ignored. */
                unlocking: {
                    tags: [SSOStateMachineTags.submitting],
                    on: blockWaysOut,
                    invoke: {
                        src: 'unlockWithBackupPassword',
                        input: ({ context, event }) => {
                            assertEvent(event, 'sso.backupPassword.submitted');
                            return {
                                auth: context.auth,
                                ssoData: context.ssoData,
                                password: event.payload.password,
                            };
                        },
                        onDone: routeSignInResult,
                        onError: [retryOnWrongPassword('idle'), failAccountFlow],
                    },
                },
            },
            on: {
                'sso.adminHelp.requested': askAdminHelp,
                'decision.back': '#sso.waysIn.previous',
            },
        },

        /** Members who still have a temporary password set a backup password before signing in. */
        routeSession: {
            always: [
                {
                    guard: and(['isTemporaryPasswordSession', 'isSSOBackupPasswordDisabled']),
                    target: 'newBackupPassword',
                },
                { guard: 'isTemporaryPasswordSession', target: 'adminGranted' },
                { target: 'completing' },
            ],
        },
        adminGranted: {
            entry: { type: 'setScreen', params: { screen: 'adminGranted' } },
            on: {
                'sso.continued': { target: 'newBackupPassword' },
            },
        },
        /** Set a backup password, or just continue when the organization disabled it. */
        newBackupPassword: {
            entry: { type: 'setScreen', params: { screen: 'newBackupPassword' } },
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        'sso.newBackupPassword.submitted': { target: 'submitting' },
                    },
                },
                submitting: {
                    tags: [SSOStateMachineTags.submitting],
                    on: blockWaysOut,
                    invoke: {
                        src: 'changeBackupPassword',
                        input: ({ context, event }) => {
                            assertEvent(event, 'sso.newBackupPassword.submitted');
                            return {
                                auth: context.auth,
                                ssoData: context.ssoData,
                                session: context.session,
                                password: event.payload.password,
                            };
                        },
                        onDone: {
                            target: '#sso.completing',
                            actions: { type: 'setSession', params: ({ event }) => ({ session: event.output }) },
                        },
                        onError: failAccountFlow,
                    },
                },
            },
        },

        /** Hands the session to the app; the current screen stays up with its loading state, and its ways out are ignored. */
        completing: {
            tags: [SSOStateMachineTags.submitting],
            on: blockWaysOut,
            invoke: {
                src: 'completeSignIn',
                input: ({ context }) => ({ session: context.session }),
                onDone: {
                    target: 'signedIn',
                    actions: { type: 'setResult', params: { result: { type: 'signedIn' } } },
                },
                onError: failAccountFlow,
            },
        },
        signedIn: {
            type: 'final',
        },
        cancelled: {
            type: 'final',
            entry: { type: 'setResult', params: { result: { type: 'cancelled' } } },
        },
        failed: {
            id: ACCOUNT_FLOW_FAILED,
            type: 'final',
        },
    },
});

/** A request runs; the screen shows its loading state. */
export const selectSubmitting = (snapshot: SnapshotFrom<typeof ssoStateMachine>) =>
    snapshot.hasTag(SSOStateMachineTags.submitting);

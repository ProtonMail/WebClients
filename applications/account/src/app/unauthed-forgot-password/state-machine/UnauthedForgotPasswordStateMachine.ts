/**
 * Forgot-password flow state machine — naming conventions:
 * - **States:** camelCase; work-in-progress describes the step (`verifyRecoveryEmail`); states that only pick the
 *   next step, with eventless transitions, are named `route*`.
 * - **Events:** `domain.action` (e.g. `code.submitted`, `decision.skip`) so related events sort together.
 * - **Actors / machine actions:** camelCase verbs (`sendResetCode`, `redirectToSignIn`).
 *
 * Every request is an actor invoked by a work state (`forgotPasswordActors`), so leaving a state stops caring about
 * its request, whose result can never land in a later step. The steps send what the user did and read the state.
 */
import { type SnapshotFrom, assertEvent, assign, emit, or, setup } from 'xstate';

import type { DelegatedAccessSummary, RecoveryMethod, ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { errorOf, isErrorOf, reportActorError, unprovidedActors } from '../../sign-in/state-machine/machineHelpers';
import { DeviceRecoveryLevel } from '../actions';
import type {
    CodeMethod,
    ForgotPasswordActors,
    MnemonicDataWithoutAPI,
    OwnershipProof,
    RecoveryMethods,
} from './forgotPasswordActors';
import {
    InvalidResetCodeError,
    NoKeysDecryptedUsingPhraseError,
    ResetKeysRejectedError,
    ResetMethodNotAllowedError,
    ResetTokenRejectedError,
    SignInAfterResetError,
} from './forgotPasswordErrors';

interface UnauthedForgotPasswordMachineContext {
    username: string;
    ownershipVerificationMethod: RecoveryMethod | undefined;
    ownershipVerificationCode: string;
    resetResponse: ValidateResetTokenResponse | undefined;
    deviceRecoveryLevel: DeviceRecoveryLevel;
    recoveryMethods: RecoveryMethod[];
    hasEmergencyContacts: boolean;
    resetWithDataLoss: boolean;
    mnemonicData: MnemonicDataWithoutAPI | undefined;
    delegatedAccessContacts: DelegatedAccessSummary[];
    redactedRecoveryEmail: string | undefined;
    redactedRecoveryPhoneNumber: string | undefined;
    /** Why the API refused a recovery method, for its error step. */
    apiErrorMessage: string | undefined;
    /** The last code was wrong; cleared once the user edits it or a new one is sent. */
    invalidCode: boolean;
}

/**
 * Event types use `domain.action` segments so new flows can add siblings without renaming.
 * `decision.*` are shared UX intents reused across steps.
 */
type UnauthedForgotPasswordMachineEvent =
    | { type: 'decision.confirm' }
    | { type: 'decision.no' }
    | { type: 'decision.back' }
    | { type: 'decision.skip' }
    | { type: 'decision.yes' }
    /** The entry step: the account to recover, or a link that opened the page. */
    | { type: 'username.submitted'; payload: { username: string } }
    | { type: 'username.prefilled'; payload: { username: string } }
    | { type: 'resetLink.opened'; payload: { username: string; token: string } }
    | { type: 'recoveryLink.opened'; payload: { username: string; mnemonic: string } }
    /** The code steps, for the recovery email or phone. */
    | { type: 'code.requested' }
    | { type: 'code.submitted'; payload: { code: string } }
    | { type: 'code.edited' }
    /** The new code dialog: opened, confirmed, or dismissed. */
    | { type: 'newCode.requested' }
    | { type: 'newCode.confirmed' }
    | { type: 'newCode.dismissed' }
    | { type: 'phrase.submitted'; payload: { mnemonic: string } }
    | { type: 'password.submitted'; payload: { password: string } }
    | { type: 'socialRecovery.started' };

export type UnauthedForgotPasswordMachineEmitted =
    /** A request failed in a way the step doesn't show itself; the page shows it. */
    | { type: 'error'; error: unknown }
    /** The new code was sent: the code form tells the user, and clears the old code. */
    | { type: 'code.resent' }
    /** The password is changed, but signing in with it failed: the page traces what failed, without showing it. */
    | { type: 'signIn.failed'; error: unknown };

export enum UnauthedForgotPasswordStateMachineTags {
    hideReturnToSignIn = 'hideReturnToSignIn',
    /** A request runs; the step shows its loading state. */
    submitting = 'submitting',
    /**
     * Back and "Try another way" wait for the request, which could undo where they lead: a code sent meanwhile, which
     * a wrong code or the phrase signing in deletes, or a later code replaces. As in the sign-in, the back buttons
     * stay, doing nothing.
     */
    backWaits = 'backWaits',
    /** The code steps' new code dialog is open. */
    newCodeDialog = 'newCodeDialog',
    /** The dialog stays open while the new code is sent. */
    resending = 'resending',
}

/**
 * Back between the recovery methods goes to the latest earlier one the account has: the user skipped it to get here,
 * so it's offered again. The email step sends a new code, as on its first visit: the API keeps one reset token per
 * account, which a later code replaces, and a wrong code or a sign-in with the phrase deletes. The SMS step offers to
 * send one again. With no earlier method, the entry step.
 *
 * The transitions are `as const`, so that the machine checks their guard names.
 */
const backToEmail = { guard: 'hasEmailRecovery', target: '#forgotPassword.verifyRecoveryEmail' } as const;
const backToSms = { guard: 'hasSmsRecovery', target: '#forgotPassword.enterRecoverySms' } as const;
const backToPhrase = { guard: 'hasMnemonic', target: '#forgotPassword.mnemonicRecovery.enterPhrase' } as const;
const backToEntry = { target: '#forgotPassword.entry' } as const;
const backFromSms = [backToEmail, backToEntry] as const;
/**
 * A proven ownership is a checkpoint: back from the phrase step after a valid code starts a new attempt rather than
 * asking for the code again.
 */
const backFromPhrase = [{ guard: 'hasResetResponse', ...backToEntry }, backToSms, ...backFromSms] as const;
const backFromUnauthenticatedRecovery = [backToPhrase, backToSms, ...backFromSms] as const;

/**
 * Back in the verified recovery goes to the latest earlier prompt or offer the user saw. Each of those screens shows
 * when its guard holds, so the guards tell which one it was: from the latest, the emergency access offer, the social
 * recovery offer, the signed-in sessions prompt and the phrase step; with none of them, the entry screen.
 *
 * Back skips the instructions a prompt or offer may have led to (emergency contacts, signed-in sessions): having seen
 * them leaves the same context as having declined, so back returns to the prompt or offer, which leads to them again.
 */
const backFromSessionsPrompt = [backToPhrase, backToEntry] as const;
const backFromSocialRecoveryOffer = [
    { guard: 'hasOtherLoggedInSessions', target: '#forgotPassword.authenticatedRecovery.otherSessionsPrompt' },
    ...backFromSessionsPrompt,
] as const;
const backFromEmergencyAccessOffer = [
    { guard: 'hasSocialContacts', target: '#forgotPassword.authenticatedRecovery.socialRecoveryOffer' },
    ...backFromSocialRecoveryOffer,
] as const;
const backFromDataLossOffer = [
    { guard: 'hasEmergencyContacts', target: '#forgotPassword.authenticatedRecovery.emergencyAccessOffer' },
    ...backFromEmergencyAccessOffer,
] as const;

const forgotPasswordSetup = setup({
    types: {
        context: {} as UnauthedForgotPasswordMachineContext,
        events: {} as UnauthedForgotPasswordMachineEvent,
        emitted: {} as UnauthedForgotPasswordMachineEmitted,
        tags: {} as `${UnauthedForgotPasswordStateMachineTags}`,
    },
    actors: {
        ...unprovidedActors<ForgotPasswordActors>({
            requestRecoveryMethods: true,
            validateResetLink: true,
            validateRecoveryLink: true,
            sendResetCode: true,
            validateResetCode: true,
            validatePhrase: true,
            resetPassword: true,
        }),
    },
    guards: {
        /** The codes can go to an email: the recovery email, or the external email the account signs in with. */
        hasEmailRecovery: ({ context }) =>
            context.recoveryMethods.includes('email') || context.recoveryMethods.includes('login'),
        hasSmsRecovery: ({ context }) => context.recoveryMethods.includes('sms'),
        hasMnemonic: ({ context }) => context.recoveryMethods.includes('mnemonic'),
        hasFullDeviceRecovery: ({ context: { deviceRecoveryLevel } }) =>
            deviceRecoveryLevel === DeviceRecoveryLevel.FULL,
        hasResetResponse: ({ context }) => !!context.resetResponse,
        hasOtherLoggedInSessions: ({ context }) => !!context.resetResponse && context.resetResponse.Sessions.length > 0,
        hasSocialContacts: ({ context }) =>
            context.delegatedAccessContacts?.some(({ Types }) => hasBit(Types, DelegatedAccessTypeEnum.SocialRecovery)),
        hasEmergencyContacts: ({ context }) =>
            context.hasEmergencyContacts ||
            context.delegatedAccessContacts?.some(({ Types }) =>
                hasBit(Types, DelegatedAccessTypeEnum.EmergencyAccess)
            ),
        isErrorOf,
    },
    actions: {
        /** Leaves for the sign-in page, whose form starts with the username the user gave, if any. */
        redirectToSignIn: () => {},
        /** The account's recovery methods, and where their codes go, for this attempt. */
        storeRecoveryMethods: assign((_, params: RecoveryMethods) => ({
            recoveryMethods: params.methods,
            username: params.username,
            redactedRecoveryEmail: params.redactedEmail,
            redactedRecoveryPhoneNumber: params.redactedPhoneNumber,
            hasEmergencyContacts: params.hasEmergencyContacts,
        })),
        setUsername: assign((_, params: { username: string }) => ({ username: params.username })),
        /** Ownership was proven: the reset token, and what the account can recover with it. */
        storeOwnershipProof: assign((_, params: OwnershipProof & { method: RecoveryMethod }) => ({
            ownershipVerificationMethod: params.method,
            ownershipVerificationCode: params.ownershipVerificationCode,
            resetResponse: params.resetResponse,
            delegatedAccessContacts: params.resetResponse.DelegatedAccesses,
            deviceRecoveryLevel: params.deviceRecoveryLevel,
        })),
        /** The recovery phrase decrypted the account's keys, which the reset re-encrypts. */
        storeMnemonicData: assign((_, params: { mnemonicData: MnemonicDataWithoutAPI }) => ({
            mnemonicData: params.mnemonicData,
        })),
        /**
         * A new attempt, maybe for another account: the ownership an earlier attempt proved, or the data loss it
         * accepted, no longer counts.
         */
        startNewAttempt: assign({
            ownershipVerificationMethod: undefined,
            ownershipVerificationCode: '',
            resetResponse: undefined,
            delegatedAccessContacts: [],
            deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
            invalidCode: false,
            resetWithDataLoss: false,
        }),
        /** After `errorOf(ResetMethodNotAllowedError)`: the error has the API's reason. */
        setApiErrorMessage: assign((_, params: { error: unknown }) => ({
            apiErrorMessage: params.error instanceof ResetMethodNotAllowedError ? params.error.message : undefined,
        })),
        clearApiErrorMessage: assign({ apiErrorMessage: undefined }),
        markInvalidCode: assign({ invalidCode: true }),
        clearInvalidCode: assign({ invalidCode: false }),
        acceptDataLoss: assign({ resetWithDataLoss: true }),
        /** Hands the error to the page to show. */
        reportError: emit((_, params: { error: unknown }) => ({ type: 'error' as const, error: params.error })),
        notifyCodeResent: emit({ type: 'code.resent' as const }),
        /** After `errorOf(SignInAfterResetError)`: hands what failed to the page, to trace. */
        traceSignInFailure: emit((_, params: { error: unknown }) => ({
            type: 'signIn.failed' as const,
            error: params.error instanceof SignInAfterResetError ? params.error.cause : params.error,
        })),
    },
});

/** A request that Back and "Try another way" wait for (`backWaits`): they do nothing until it settles. */
const waitsForRequest = {
    tags: [UnauthedForgotPasswordStateMachineTags.submitting, UnauthedForgotPasswordStateMachineTags.backWaits],
    on: { 'decision.back': {}, 'decision.skip': {} },
};

/**
 * Sends a reset code. The API refuses a method with a reason (a rate limit, say), which gets its own step; any other
 * failure shows, and the step goes on to `failedTarget`.
 */
const sendingCode = (method: CodeMethod, step: string, sentTarget: string, failedTarget: string) =>
    forgotPasswordSetup.createStateConfig({
        // The email code is sent as its step opens, without the user asking: the code form is up meanwhile, so this
        // isn't shown as a request, and Verify waits for the code (`ResetCodeForm`). The SMS code is sent once the
        // user asks. Back and "Try another way" wait for either
        ...waitsForRequest,
        ...(method === 'email' && { tags: [UnauthedForgotPasswordStateMachineTags.backWaits] }),
        invoke: {
            src: 'sendResetCode',
            input: ({ context }) => ({ username: context.username, method, step }),
            onDone: { target: sentTarget },
            onError: [
                {
                    guard: errorOf(ResetMethodNotAllowedError),
                    target: '#forgotPassword.recoveryMethodVerificationError',
                    actions: { type: 'setApiErrorMessage', params: ({ event }) => ({ error: event.error }) },
                },
                { target: failedTarget, actions: reportActorError },
            ],
        },
    });

/**
 * The code sent to the recovery email or phone: a valid one proves ownership. A new code is sent from a dialog that
 * asks first, since the first one may just be in the spam folder.
 */
const awaitingCode = (method: CodeMethod, step: string) =>
    forgotPasswordSetup.createStateConfig({
        // A wrong code says nothing about the next code form, which can show while its code is sent: the email one,
        // back from the SMS step
        exit: 'clearInvalidCode',
        initial: 'editing',
        states: {
            editing: {
                on: {
                    'code.submitted': { target: 'validating' },
                    'code.edited': { actions: 'clearInvalidCode' },
                    'newCode.requested': { target: 'newCodeDialog' },
                },
            },
            validating: {
                ...waitsForRequest,
                invoke: {
                    src: 'validateResetCode',
                    input: ({ context, event }) => {
                        assertEvent(event, 'code.submitted');
                        return { username: context.username, method, step, code: event.payload.code };
                    },
                    onDone: {
                        target: '#forgotPassword.routeDeviceRecovery',
                        actions: { type: 'storeOwnershipProof', params: ({ event }) => ({ ...event.output, method }) },
                    },
                    onError: [
                        {
                            guard: errorOf(InvalidResetCodeError),
                            target: 'editing',
                            actions: 'markInvalidCode',
                        },
                        { target: 'editing', actions: reportActorError },
                    ],
                },
            },
            newCodeDialog: {
                tags: [UnauthedForgotPasswordStateMachineTags.newCodeDialog],
                on: {
                    'newCode.confirmed': { target: 'resending' },
                    'newCode.dismissed': { target: 'editing' },
                },
            },
            /** The dialog stays open, loading, until the new code was sent. */
            resending: {
                tags: [
                    UnauthedForgotPasswordStateMachineTags.newCodeDialog,
                    UnauthedForgotPasswordStateMachineTags.resending,
                ],
                invoke: {
                    src: 'sendResetCode',
                    input: ({ context }) => ({ username: context.username, method, step }),
                    onDone: { target: 'editing', actions: ['clearInvalidCode', 'notifyCodeResent'] },
                    onError: [
                        {
                            guard: errorOf(ResetMethodNotAllowedError),
                            target: '#forgotPassword.recoveryMethodVerificationError',
                            actions: { type: 'setApiErrorMessage', params: ({ event }) => ({ error: event.error }) },
                        },
                        { target: 'newCodeDialog', actions: reportActorError },
                    ],
                },
            },
        },
    });

export const UnauthedForgotPasswordStateMachine = forgotPasswordSetup.createMachine({
    id: 'forgotPassword',
    initial: 'entry',
    context: {
        username: '',
        ownershipVerificationMethod: undefined,
        ownershipVerificationCode: '',
        resetResponse: undefined,
        deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
        recoveryMethods: [],
        hasEmergencyContacts: false,
        apiErrorMessage: undefined,
        resetWithDataLoss: false,
        mnemonicData: undefined,
        delegatedAccessContacts: [],
        redactedRecoveryEmail: undefined,
        redactedRecoveryPhoneNumber: undefined,
        invalidCode: false,
    },

    states: {
        /** User picks recovery path (account request, or pre-filled reset). */
        entry: {
            tags: [UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn],
            // However the user comes back here, the next attempt starts from scratch
            entry: 'startNewAttempt',
            initial: 'idle',
            on: {
                'decision.back': {
                    actions: 'redirectToSignIn',
                },
            },
            states: {
                idle: {
                    on: {
                        'username.submitted': {
                            target: 'requestingMethods',
                            actions: { type: 'setUsername', params: ({ event }) => event.payload },
                        },
                        'username.prefilled': {
                            actions: { type: 'setUsername', params: ({ event }) => event.payload },
                        },
                        'resetLink.opened': {
                            target: 'validatingResetLink',
                            actions: { type: 'setUsername', params: ({ event }) => event.payload },
                        },
                        'recoveryLink.opened': {
                            target: 'validatingRecoveryLink',
                            actions: { type: 'setUsername', params: ({ event }) => event.payload },
                        },
                    },
                },
                requestingMethods: {
                    tags: [UnauthedForgotPasswordStateMachineTags.submitting],
                    invoke: {
                        src: 'requestRecoveryMethods',
                        input: ({ context }) => ({ username: context.username }),
                        onDone: {
                            target: '#forgotPassword.routeRecoveryMethod',
                            actions: { type: 'storeRecoveryMethods', params: ({ event }) => event.output },
                        },
                        onError: { target: 'idle', actions: reportActorError },
                    },
                },
                validatingResetLink: {
                    tags: [UnauthedForgotPasswordStateMachineTags.submitting],
                    invoke: {
                        src: 'validateResetLink',
                        input: ({ context, event }) => {
                            assertEvent(event, 'resetLink.opened');
                            return { username: context.username, token: event.payload.token };
                        },
                        onDone: {
                            target: '#forgotPassword.setNewPassword',
                            actions: {
                                type: 'storeOwnershipProof',
                                params: ({ event }) => ({ ...event.output, method: 'mnemonic' as const }),
                            },
                        },
                        onError: { target: 'idle', actions: reportActorError },
                    },
                },
                validatingRecoveryLink: {
                    tags: [UnauthedForgotPasswordStateMachineTags.submitting],
                    invoke: {
                        src: 'validateRecoveryLink',
                        input: ({ context, event }) => {
                            assertEvent(event, 'recoveryLink.opened');
                            return { username: context.username, mnemonic: event.payload.mnemonic };
                        },
                        onDone: {
                            target: '#forgotPassword.setNewPassword',
                            actions: {
                                type: 'storeMnemonicData',
                                params: ({ event }) => ({ mnemonicData: event.output }),
                            },
                        },
                        onError: { target: 'idle', actions: reportActorError },
                    },
                },
            },
        },

        /** The first recovery method the account has: email, then SMS, then the recovery phrase. */
        routeRecoveryMethod: {
            always: [
                {
                    guard: 'hasEmailRecovery',
                    target: 'verifyRecoveryEmail',
                },
                {
                    guard: 'hasSmsRecovery',
                    target: 'enterRecoverySms',
                },
                {
                    target: 'mnemonicRecovery',
                },
            ],
        },

        /** The code is sent to the recovery email as soon as the step opens. */
        verifyRecoveryEmail: {
            initial: 'sendingCode',
            on: {
                'decision.back': {
                    target: 'entry',
                },
                // Another way: the next method the account has
                'decision.skip': [
                    { guard: 'hasSmsRecovery', target: 'enterRecoverySms' },
                    { target: 'mnemonicRecovery' },
                ],
            },
            states: {
                // A code that failed to send can still be sent again from the code form
                sendingCode: sendingCode('email', 'verifyRecoveryEmail', 'awaitingCode', 'awaitingCode'),
                awaitingCode: awaitingCode('email', 'verifyRecoveryEmail'),
            },
        },

        /** The code is only sent to the recovery phone once the user asks, since it may cost them. */
        enterRecoverySms: {
            initial: 'idle',
            on: {
                'decision.back': backFromSms,
                'decision.skip': { target: 'mnemonicRecovery' },
            },
            states: {
                idle: {
                    on: {
                        'code.requested': { target: 'sendingCode' },
                    },
                },
                sendingCode: sendingCode('sms', 'enterRecoverySms', '#forgotPassword.verifyRecoverySms', 'idle'),
            },
        },

        verifyRecoverySms: {
            initial: 'awaitingCode',
            on: {
                'decision.back': {
                    target: 'enterRecoverySms',
                },
                'decision.skip': { target: 'mnemonicRecovery' },
            },
            states: {
                awaitingCode: awaitingCode('sms', 'verifyRecoverySms'),
            },
        },

        /** With a full device recovery, the password can be reset without losing data. */
        routeDeviceRecovery: {
            always: [
                {
                    guard: 'hasFullDeviceRecovery',
                    target: 'setNewPassword',
                },
                {
                    target: 'mnemonicRecovery',
                },
            ],
        },

        mnemonicRecovery: {
            initial: 'routeMnemonic',
            states: {
                /** The recovery phrase when the account has one; otherwise the other ways to recover. */
                routeMnemonic: {
                    always: [
                        {
                            guard: 'hasMnemonic',
                            target: 'enterPhrase',
                        },
                        {
                            guard: 'hasResetResponse',
                            target: '#forgotPassword.authenticatedRecovery',
                        },
                        {
                            target: '#forgotPassword.unauthenticatedRecovery',
                        },
                    ],
                },
                enterPhrase: {
                    initial: 'idle',
                    on: {
                        'decision.back': backFromPhrase,
                        'decision.skip': [
                            {
                                guard: 'hasResetResponse',
                                target: '#forgotPassword.authenticatedRecovery',
                            },
                            {
                                target: '#forgotPassword.unauthenticatedRecovery',
                            },
                        ],
                    },
                    states: {
                        idle: {
                            on: {
                                'phrase.submitted': { target: 'validating' },
                            },
                        },
                        validating: {
                            ...waitsForRequest,
                            invoke: {
                                src: 'validatePhrase',
                                input: ({ context, event }) => {
                                    assertEvent(event, 'phrase.submitted');
                                    return { username: context.username, mnemonic: event.payload.mnemonic };
                                },
                                onDone: {
                                    target: '#forgotPassword.mnemonicRecovery.confirmPhrase',
                                    actions: {
                                        type: 'storeMnemonicData',
                                        params: ({ event }) => ({ mnemonicData: event.output }),
                                    },
                                },
                                onError: [
                                    {
                                        // The phrase signed in, which deletes any reset code, so the attempt can't go
                                        // on: the user starts over, and the page says something went wrong
                                        guard: errorOf(NoKeysDecryptedUsingPhraseError),
                                        target: '#forgotPassword.entry',
                                        actions: reportActorError,
                                    },
                                    { target: 'idle', actions: reportActorError },
                                ],
                            },
                        },
                    },
                },
                confirmPhrase: {
                    on: {
                        'decision.confirm': {
                            target: '#forgotPassword.setNewPassword',
                        },
                    },
                },
            },
        },

        /**
         * Ownership proven by email or SMS, so there is a reset token (`resetResponse`), and no recovery phrase used:
         * the account's other sessions, then its contacts, then a reset that loses data.
         */
        authenticatedRecovery: {
            initial: 'routeOtherSessions',
            states: {
                /** The account's other signed-in sessions may reset the password without losing data. */
                routeOtherSessions: {
                    always: [
                        {
                            guard: 'hasOtherLoggedInSessions',
                            target: 'otherSessionsPrompt',
                        },
                        {
                            target: 'routeDelegatedAccess',
                        },
                    ],
                },
                otherSessionsPrompt: {
                    on: {
                        'decision.yes': {
                            target: 'activeSessionInstructions',
                        },
                        'decision.back': backFromSessionsPrompt,
                        'decision.no': {
                            target: 'routeDelegatedAccess',
                        },
                    },
                },
                activeSessionInstructions: {
                    on: {
                        'decision.skip': {
                            target: 'routeDelegatedAccess',
                        },
                        'decision.back': {
                            target: 'otherSessionsPrompt',
                        },
                    },
                },
                /** The account's recovery contacts, then its emergency contacts, then a reset that loses data. */
                routeDelegatedAccess: {
                    always: [
                        {
                            guard: 'hasSocialContacts',
                            target: 'socialRecoveryOffer',
                        },
                        {
                            guard: 'hasEmergencyContacts',
                            target: 'emergencyAccessOffer',
                        },
                        {
                            target: '#forgotPassword.offerDataLossReset',
                        },
                    ],
                },
                socialRecoveryOffer: {
                    on: {
                        'socialRecovery.started': {
                            target: '#forgotPassword.setNewPassword',
                        },
                        'decision.back': backFromSocialRecoveryOffer,
                        'decision.skip': [
                            {
                                guard: 'hasEmergencyContacts',
                                target: 'emergencyAccessOffer',
                            },
                            {
                                target: '#forgotPassword.offerDataLossReset',
                            },
                        ],
                    },
                },
                emergencyAccessOffer: {
                    on: {
                        'decision.yes': {
                            target: '#forgotPassword.unauthenticatedRecovery.emergencyContactInstructions',
                        },
                        'decision.back': backFromEmergencyAccessOffer,
                        'decision.no': {
                            target: '#forgotPassword.offerDataLossReset',
                        },
                    },
                },
            },
        },

        /**
         * Ownership not proven, and no recovery phrase used: the account's other sessions and emergency contacts can
         * still help, outside this flow.
         */
        unauthenticatedRecovery: {
            initial: 'otherSessionsPrompt',
            states: {
                otherSessionsPrompt: {
                    on: {
                        'decision.yes': {
                            target: 'activeSessionInstructions',
                        },
                        'decision.no': [
                            {
                                guard: 'hasEmergencyContacts',
                                target: 'emergencyAccessOffer',
                            },
                            {
                                target: '#forgotPassword.recoveryFailed',
                            },
                        ],
                        'decision.back': backFromUnauthenticatedRecovery,
                    },
                },
                activeSessionInstructions: {
                    on: {
                        'decision.skip': [
                            {
                                guard: 'hasEmergencyContacts',
                                target: 'emergencyAccessOffer',
                            },
                            {
                                target: '#forgotPassword.recoveryFailed',
                            },
                        ],
                        'decision.back': {
                            target: 'otherSessionsPrompt',
                        },
                    },
                },
                emergencyAccessOffer: {
                    on: {
                        'decision.yes': {
                            target: 'emergencyContactInstructions',
                        },
                        'decision.no': {
                            target: '#forgotPassword.recoveryFailed',
                        },
                        'decision.back': {
                            target: 'otherSessionsPrompt',
                        },
                    },
                },
                /**
                 * How emergency contacts can change the password, offered by either branch. It stays here, so that
                 * `previous` can return to it from `recoveryFailed`.
                 */
                emergencyContactInstructions: {
                    on: {
                        'decision.skip': [
                            {
                                guard: 'hasResetResponse',
                                target: '#forgotPassword.offerDataLossReset',
                            },
                            {
                                target: '#forgotPassword.recoveryFailed',
                            },
                        ],
                        'decision.back': [
                            {
                                guard: 'hasResetResponse',
                                target: '#forgotPassword.authenticatedRecovery.emergencyAccessOffer',
                            },
                            {
                                target: 'emergencyAccessOffer',
                            },
                        ],
                    },
                },

                /** The last step shown here, or else the sessions prompt. */
                previous: { type: 'history', target: 'otherSessionsPrompt' },
            },
        },

        offerDataLossReset: {
            on: {
                'decision.yes': {
                    target: '#forgotPassword.setNewPassword',
                    actions: 'acceptDataLoss',
                },
                'decision.skip': {
                    target: 'recoveryFailed',
                },
                'decision.back': backFromDataLossOffer,
            },
        },

        setNewPassword: {
            tags: [UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn],
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        'password.submitted': { target: 'resetting' },
                    },
                },
                resetting: {
                    tags: [UnauthedForgotPasswordStateMachineTags.submitting],
                    invoke: {
                        src: 'resetPassword',
                        input: ({ context, event }) => {
                            assertEvent(event, 'password.submitted');
                            return {
                                newPassword: event.payload.password,
                                username: context.username,
                                mnemonicData: context.mnemonicData,
                                resetResponse: context.resetResponse,
                                ownershipVerificationCode: context.ownershipVerificationCode,
                                ownershipVerificationMethod: context.ownershipVerificationMethod,
                                deviceRecoveryLevel: context.deviceRecoveryLevel,
                            };
                        },
                        onDone: { target: 'signedIn' },
                        onError: [
                            {
                                // The token is refused, or used up by a reset that refused the new keys, so the form
                                // can't be sent again: the user starts over, and the page says why
                                guard: or([errorOf(ResetTokenRejectedError), errorOf(ResetKeysRejectedError)]),
                                target: '#forgotPassword.entry',
                                actions: reportActorError,
                            },
                            {
                                // The password is changed, so the form can't be sent again: the user signs in with it
                                guard: errorOf(SignInAfterResetError),
                                target: 'passwordChanged',
                                actions: [
                                    { type: 'traceSignInFailure', params: ({ event }) => ({ error: event.error }) },
                                    'redirectToSignIn',
                                ],
                            },
                            { target: 'idle', actions: reportActorError },
                        ],
                    },
                },
                /** The app takes the session and leaves the page; the form stays up, loading, meanwhile. */
                signedIn: {
                    tags: [UnauthedForgotPasswordStateMachineTags.submitting],
                },
                /**
                 * The password is changed, but signing in with it failed: the page leaves for the sign-in, and the
                 * form stays up, loading, meanwhile.
                 */
                passwordChanged: {
                    tags: [UnauthedForgotPasswordStateMachineTags.submitting],
                },
            },
        },

        recoveryFailed: {
            on: {
                'decision.back': [
                    {
                        // Ownership was proven in this attempt (`resetResponse` is cleared on entry), so this came from
                        // declining the data-loss reset
                        guard: 'hasResetResponse',
                        target: 'offerDataLossReset',
                    },
                    {
                        // Otherwise one of the unauthenticated recovery steps led here
                        target: '#forgotPassword.unauthenticatedRecovery.previous',
                    },
                ],
            },
        },

        recoveryMethodVerificationError: {
            on: {
                'decision.back': {
                    target: '#forgotPassword.entry',
                    actions: 'clearApiErrorMessage',
                },
                'decision.skip': {
                    actions: 'redirectToSignIn',
                },
            },
        },
    },
});

export type UnauthedForgotPasswordSnapshot = SnapshotFrom<typeof UnauthedForgotPasswordStateMachine>;

type ContextOnly = { context: UnauthedForgotPasswordMachineContext };

/**
 * What the page and the steps read, with `useSelector`. Each returns one value, kept as context holds it, so a
 * component only re-renders when what it shows changes.
 */
export const selectUsername = ({ context }: ContextOnly) => context.username;

/** The reset token's response, once ownership was proven: the account's sessions, keys and password policies. */
export const selectResetResponse = ({ context }: ContextOnly) => context.resetResponse;

export const selectDelegatedAccessContacts = ({ context }: ContextOnly) => context.delegatedAccessContacts;

/** Where the codes go, redacted, for the code steps to say. */
export const selectRedactedRecoveryEmail = ({ context }: ContextOnly) => context.redactedRecoveryEmail;

export const selectRedactedRecoveryPhoneNumber = ({ context }: ContextOnly) => context.redactedRecoveryPhoneNumber;

/** Why the API refused a recovery method, for its error step. */
export const selectApiErrorMessage = ({ context }: ContextOnly) => context.apiErrorMessage;

/** The user accepted losing their data, so the reset form's button shows the reset as dangerous. */
export const selectResetWithDataLoss = ({ context }: ContextOnly) => context.resetWithDataLoss;

/** The last code was wrong. */
export const selectInvalidCode = ({ context }: ContextOnly) => context.invalidCode;

/** A request runs; the step shows its loading state. */
export const selectSubmitting = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.submitting);

/** The code steps' new code dialog is open. */
export const selectNewCodeDialogOpen = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.newCodeDialog);

/** The new code is being sent; the dialog stays open, loading. */
export const selectResending = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.resending);

/** The email code was sent, or failed to be (the code form can send another): Verify can check a code. */
export const selectEmailAwaitingCode = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.matches({ verifyRecoveryEmail: 'awaitingCode' });

/** The entry step, which the page decorates. */
export const selectOnEntry = (snapshot: UnauthedForgotPasswordSnapshot) => snapshot.matches('entry');

/**
 * The step has somewhere to go back to, so the page and the step's heading show a back button. It stays while Back
 * waits for a request (`backWaits`), doing nothing meanwhile.
 */
export const selectCanGoBack = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.can({ type: 'decision.back' }) || snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.backWaits);

/**
 * Back and "Try another way" wait for a request (`backWaits`): the step's skip button is disabled meanwhile, without
 * the disabled look, since the request usually settles within a second.
 */
export const selectBackWaits = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.backWaits);

export const selectHideReturnToSignIn = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn);

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
import { type SnapshotFrom, assertEvent, assign, emit, setup } from 'xstate';

import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { DelegatedAccessSummary, RecoveryMethod, ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { reportActorError, unprovidedActors } from '../../sign-in/state-machine/machineHelpers';
import { DeviceRecoveryLevel } from '../actions';
import type {
    CodeMethod,
    ForgotPasswordActors,
    MnemonicDataWithoutAPI,
    OwnershipProof,
    RecoveryMethods,
} from './forgotPasswordActors';

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
    emailRecoverySkipped: boolean;
    smsRecoverySkipped: boolean;
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
    /** The reset token was refused when setting the new password: the page is out of date. */
    | { type: 'resetToken.rejected' };

export enum UnauthedForgotPasswordStateMachineTags {
    hideReturnToSignIn = 'hideReturnToSignIn',
    /** A request runs; the step shows its loading state. */
    submitting = 'submitting',
    /** The code steps' new code dialog is open. */
    newCodeDialog = 'newCodeDialog',
    /** The dialog stays open while the new code is sent. */
    resending = 'resending',
}

/**
 * Back in the verified recovery goes to the latest earlier prompt or offer the user saw. Each of those screens shows
 * when its guard holds, so the guards tell which one it was: from the latest, the emergency access offer, the social
 * recovery offer, the signed-in sessions prompt and the phrase step; with none of them, the entry screen.
 *
 * Back skips the instructions a prompt or offer may have led to (emergency contacts, signed-in sessions): having seen
 * them leaves the same context as having declined, so back returns to the prompt or offer, which leads to them again.
 */
const backFromSessionsPrompt = [
    { guard: 'hasMnemonic' as const, target: '#forgotPassword.mnemonicRecovery.enterPhrase' },
    { target: '#forgotPassword.entry' },
];
const backFromSocialRecoveryOffer = [
    { guard: 'hasOtherLoggedInSessions' as const, target: '#forgotPassword.authenticatedRecovery.otherSessionsPrompt' },
    ...backFromSessionsPrompt,
];
const backFromEmergencyAccessOffer = [
    { guard: 'hasSocialContacts' as const, target: '#forgotPassword.authenticatedRecovery.socialRecoveryOffer' },
    ...backFromSocialRecoveryOffer,
];
const backFromDataLossOffer = [
    { guard: 'hasEmergencyContacts' as const, target: '#forgotPassword.authenticatedRecovery.emergencyAccessOffer' },
    ...backFromEmergencyAccessOffer,
];

/** Guard: the failed request's API error has this code. */
const errorCode = (code: number) => ({
    type: 'hasErrorCode' as const,
    params: ({ event }: { event: { error: unknown } }) => ({ error: event.error, code }),
});

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
        hasExternalEmailWithLoginRecovery: ({ context }) =>
            context.recoveryMethods.includes('login') && !context.emailRecoverySkipped,
        hasEmailRecovery: ({ context }) => context.recoveryMethods.includes('email') && !context.emailRecoverySkipped,
        hasSmsRecovery: ({ context }) => context.recoveryMethods.includes('sms') && !context.smsRecoverySkipped,
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
        hasErrorCode: (_, params: { error: unknown; code: number }) => getApiError(params.error).code === params.code,
    },
    actions: {
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
        skipEmailRecovery: assign({ emailRecoverySkipped: true }),
        skipSmsRecovery: assign({ smsRecoverySkipped: true }),
        /**
         * A new attempt, maybe for another account: every recovery method is offered again, including the ones skipped
         * on the way, and the ownership an earlier attempt proved no longer counts.
         */
        startNewAttempt: assign({
            emailRecoverySkipped: false,
            smsRecoverySkipped: false,
            ownershipVerificationMethod: undefined,
            ownershipVerificationCode: '',
            resetResponse: undefined,
            delegatedAccessContacts: [],
            deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
            invalidCode: false,
        }),
        setApiErrorMessage: assign((_, params: { error: unknown }) => ({
            apiErrorMessage: getApiErrorMessage(params.error),
        })),
        clearApiErrorMessage: assign({ apiErrorMessage: undefined }),
        markInvalidCode: assign({ invalidCode: true }),
        clearInvalidCode: assign({ invalidCode: false }),
        acceptDataLoss: assign({ resetWithDataLoss: true }),
        /** Hands the error to the page to show. */
        reportError: emit((_, params: { error: unknown }) => ({ type: 'error' as const, error: params.error })),
        notifyCodeResent: emit({ type: 'code.resent' as const }),
        notifyResetTokenRejected: emit({ type: 'resetToken.rejected' as const }),
    },
});

/**
 * Sends a reset code. The API refuses a method with a reason (a rate limit, say), which gets its own step; any other
 * failure shows, and the step goes on to `failedTarget`.
 */
const sendingCode = (method: CodeMethod, step: string, sentTarget: string, failedTarget: string) =>
    forgotPasswordSetup.createStateConfig({
        tags: [UnauthedForgotPasswordStateMachineTags.submitting],
        invoke: {
            src: 'sendResetCode',
            input: ({ context }) => ({ username: context.username, method, step }),
            onDone: { target: sentTarget },
            onError: [
                {
                    guard: errorCode(API_CUSTOM_ERROR_CODES.NOT_ALLOWED),
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
        // A wrong code from an earlier code step, or an earlier visit to this one, says nothing about this code
        entry: 'clearInvalidCode',
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
                tags: [UnauthedForgotPasswordStateMachineTags.submitting],
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
                            guard: errorCode(API_CUSTOM_ERROR_CODES.INVALID_VALUE),
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
                            guard: errorCode(API_CUSTOM_ERROR_CODES.NOT_ALLOWED),
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
        emailRecoverySkipped: false,
        smsRecoverySkipped: false,
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

        /** The first recovery method the account has and the user hasn't skipped. */
        routeRecoveryMethod: {
            always: [
                {
                    guard: 'hasExternalEmailWithLoginRecovery',
                    target: 'verifyRecoveryEmail',
                },
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
                'decision.skip': {
                    target: 'routeRecoveryMethod',
                    actions: 'skipEmailRecovery',
                },
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
                'decision.back': {
                    target: 'entry',
                },
                'decision.skip': {
                    target: 'routeRecoveryMethod',
                    actions: 'skipSmsRecovery',
                },
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
                'decision.skip': {
                    target: 'routeRecoveryMethod',
                    actions: 'skipSmsRecovery',
                },
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
                        'decision.back': {
                            target: '#forgotPassword.entry',
                        },
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
                            tags: [UnauthedForgotPasswordStateMachineTags.submitting],
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
                                onError: { target: 'idle', actions: reportActorError },
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
                        'decision.back': {
                            target: '#forgotPassword.entry',
                        },
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
                                guard: errorCode(API_CUSTOM_ERROR_CODES.INVALID_VALUE),
                                target: 'idle',
                                actions: 'notifyResetTokenRejected',
                            },
                            { target: 'idle', actions: reportActorError },
                        ],
                    },
                },
                /** The app takes the session and leaves the page; the form stays up, loading, meanwhile. */
                signedIn: {
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

/** The entry step, which the page decorates. */
export const selectOnEntry = (snapshot: UnauthedForgotPasswordSnapshot) => snapshot.matches('entry');

/** The step has somewhere to go back to, so the page and the step's heading show a back button. */
export const selectCanGoBack = (snapshot: UnauthedForgotPasswordSnapshot) => snapshot.can({ type: 'decision.back' });

export const selectHideReturnToSignIn = (snapshot: UnauthedForgotPasswordSnapshot) =>
    snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn);

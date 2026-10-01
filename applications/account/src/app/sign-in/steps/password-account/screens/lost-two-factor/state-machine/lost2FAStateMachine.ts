/**
 * The lost-2FA flow: the password account flow runs it as a child for a member who can't provide their second factor.
 * It offers the ways out the account has, in order: a backup code, which is a second factor and signs in, then a code
 * sent to the recovery email or phone, or the recovery phrase, each of which disables two-factor authentication so the
 * member signs in again. With no way left, it offers to reset the password. Each way's requests are actors
 * (`verificationActors`); the flow ends with its outcome, which the password account flow acts on.
 */
import { c } from 'ttag';
import { type SnapshotFrom, assertEvent, assign, emit, sendParent, setup } from 'xstate';

import type { VerificationDataResult } from '@proton/components/containers/api/humanVerification/interface';
import { InvalidCodeError, TOTPError } from '@proton/shared/lib/authentication/error';
import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';

import { errorOf, isErrorOf, reportActorError, unprovidedActors } from '../../../../../state-machine/machineHelpers';
import type { VerificationActors } from './verificationActors';

export interface Lost2FARecoveryMethods {
    email: boolean;
    phone: boolean;
    phrase: boolean;
}

/** Where a verification code goes: the account's recovery email or phone. */
export type VerificationMethod = 'email' | 'phone';

/** A sent code's token and destination; kept, so coming back to a method doesn't send another code. */
export interface VerificationResult {
    verificationDataResult: VerificationDataResult;
    token: string;
}

/** The states that show a screen, named after it; the final states have none, since the flow ends with them. */
const lost2FAScreens = [
    'requestBackupCode',
    'verifyOwnershipWithEmail',
    'verifyOwnershipWithPhone',
    'verifyOwnershipWithPhrase',
    'twoFactorDisabled',
    'noMethod',
] as const;

export type Lost2FAScreen = (typeof lost2FAScreens)[number];

interface Lost2FAMachineContext {
    recoveryMethods: Lost2FARecoveryMethods;
    username: string;
    twoFactorAuthTypes: TwoFactorAuthTypes;
    outcome: Lost2FAEnd | undefined;
    /** Why the last backup code was rejected. */
    backupCodeError: string | undefined;
    /** The sent codes, so coming back to a method doesn't send another one. */
    verificationResults: Partial<Record<VerificationMethod, VerificationResult>>;
    /** How often sending the email code failed on this visit; the user can retry a few times. */
    sendingAttempts: number;
    /** The last code was wrong; cleared once the user edits it or a new one is sent. */
    invalidCode: boolean;
}

/** How the flow ends, as telemetry reports it. */
export type Lost2FAOutcome = 'signInAgain' | 'returnToTwoFactor' | 'resetPassword';

/**
 * What the flow finishes with; the parent takes it from there. Resetting the password leaves the page instead, so
 * that flow stays on its screen until the page unloads (`resettingPassword`).
 */
export type Lost2FAEnd = Exclude<Lost2FAOutcome, 'resetPassword'>;

type Lost2FAMachineEvent =
    | { type: 'lost2FA.signInRequested' }
    | { type: 'decision.back' }
    | { type: 'lost2FA.passwordResetRequested' }
    /** From the backup code screen; checked as the second factor. */
    | { type: 'lost2FA.backupCodeSubmitted'; payload: { code: string } }
    /** The user changed the backup code; a rejected code's message goes. */
    | { type: 'lost2FA.backupCodeEdited' }
    | { type: 'lost2FA.otherMethodRequested' }
    /** The code screens (recovery email or phone). */
    | { type: 'verification.codeRequested' }
    | { type: 'verification.sendingCodeRetried' }
    /** The user changed the code; a rejected code's message goes. */
    | { type: 'verification.codeEdited' }
    | { type: 'verification.codeSubmitted'; payload: { code: string } }
    /** The new code dialog: opened, confirmed, or closed. */
    | { type: 'verification.newCodeRequested' }
    | { type: 'verification.resendRequested' }
    | { type: 'verification.newCodeDialogClosed' }
    /** The recovery phrase screen. */
    | { type: 'verification.phraseSubmitted'; payload: { phrase: string } };

/** Sent to the parent (the password account flow). */
export type Lost2FAParentEvent =
    /** The backup code signed in: it loads the account, and stops the flow once another screen shows. */
    | { type: 'lost2FA.backupCodeAccepted' }
    /**
     * Checking the backup code failed for another reason than a wrong code, like the session the third wrong code
     * revokes: it ends the sign-in attempt, and the sign-in reports the error.
     */
    | { type: 'lost2FA.backupCodeFailed'; payload: { error: unknown } }
    /** It forwards the error to the sign-in to show. */
    | { type: 'lost2FA.errorReported'; payload: { error: unknown } }
    /** The user chose to reset the password: it leaves the page for the reset. */
    | { type: 'lost2FA.passwordResetChosen' };

type Lost2FAEmitted =
    /** For telemetry: how the flow ended. */
    | { type: 'lost2FA.ended'; payload: { outcome: Lost2FAOutcome } }
    /** For telemetry: a backup code was submitted. */
    | { type: 'lost2FA.backupCodeProvided' }
    /** The new code was sent: the code form tells the user, and clears the old code. */
    | { type: 'verification.codeResent' };

/** How often sending the email code can be retried on one visit to its screen. */
const MAX_SENDING_ATTEMPTS = 3;

enum Lost2FAStateMachineTags {
    /** A verification request runs; the screen shows its loading state. */
    submitting = 'submitting',
    /** The code screens' new code dialog is open, whether the email or the phone code. */
    newCodeDialog = 'newCodeDialog',
    /** The dialog stays open while the new code is sent. */
    resending = 'resending',
}

/**
 * The ways to disable two-factor authentication, in the order the flow offers them, each when the account has it.
 * The flow starts on the first; another method goes down the list, back goes up it, and back from the first returns
 * to the two-factor screen.
 */
const methods = [
    { screen: 'requestBackupCode', guard: 'hasTOTP' },
    { screen: 'verifyOwnershipWithEmail', guard: 'hasRecoveryEmail' },
    { screen: 'verifyOwnershipWithPhone', guard: 'hasRecoveryPhone' },
    { screen: 'verifyOwnershipWithPhrase', guard: 'hasRecoveryPhrase' },
] as const;

type Method = (typeof methods)[number];
type MethodScreen = Method['screen'];

const indexOf = (screen: MethodScreen) => methods.findIndex((method) => method.screen === screen);

/** The methods after `screen`, in order; all of them when the flow starts. */
const methodsAfter = (screen?: MethodScreen) => (screen ? methods.slice(indexOf(screen) + 1) : methods);

/** The methods before `screen`, closest first; all of them from the no-method screen. */
const methodsBefore = (screen: MethodScreen | 'noMethod') =>
    [...(screen === 'noMethod' ? methods : methods.slice(0, indexOf(screen)))].reverse();

/** Goes to the first of these methods the account has, or else to `fallback`. */
const firstAvailable = (candidates: readonly Method[], fallback: string) => [
    ...candidates.map(({ screen, guard }) => ({ guard, target: `#lost2FA.${screen}` })),
    { target: fallback },
];

/** Another method: the next one the account has, or the screen saying there's none. */
const nextMethod = (screen?: MethodScreen) => firstAvailable(methodsAfter(screen), '#lost2FA.noMethod');

/** Back: the previous method the account has, or the two-factor screen from the first. */
const previousMethod = (screen: MethodScreen | 'noMethod') =>
    firstAvailable(methodsBefore(screen), '#lost2FA.returnToTwoFactor');

const lost2FASetup = setup({
    types: {
        input: {} as {
            recoveryMethods: Lost2FARecoveryMethods;
            username: string;
            twoFactorAuthTypes: TwoFactorAuthTypes;
        },
        context: {} as Lost2FAMachineContext,
        events: {} as Lost2FAMachineEvent,
        emitted: {} as Lost2FAEmitted,
        output: {} as { outcome: Lost2FAEnd },
        tags: {} as `${Lost2FAStateMachineTags}`,
    },
    guards: {
        hasTOTP: ({ context }) => context.twoFactorAuthTypes.totp,
        hasRecoveryEmail: ({ context }) => context.recoveryMethods.email,
        hasRecoveryPhone: ({ context }) => context.recoveryMethods.phone,
        hasRecoveryPhrase: ({ context }) => context.recoveryMethods.phrase,
        hasVerificationResult: ({ context }, params: { method: VerificationMethod }) =>
            !!context.verificationResults[params.method],
        canRetrySending: ({ context }) => context.sendingAttempts < MAX_SENDING_ATTEMPTS,
        isErrorOf,
    },
    actors: {
        // `createLost2FAFlow` (or a test) provides them
        ...unprovidedActors<VerificationActors>({
            verifyBackupCode: true,
            sendVerificationCode: true,
            resendVerificationCode: true,
            verifyCodeAndDisable2FA: true,
            verifyPhraseAndDisable2FA: true,
        }),
    },
    actions: {
        /** Each visit to a verification screen starts without a rejected code, and with fresh retries. */
        startVerification: assign({ invalidCode: false, sendingAttempts: 0 }),
        setVerificationResult: assign(
            ({ context }, params: { method: VerificationMethod; verificationResult: VerificationResult }) => ({
                verificationResults: { ...context.verificationResults, [params.method]: params.verificationResult },
            })
        ),
        /** Shown in the backup code form, so the user can try another code. */
        setBackupCodeError: assign((_, params: { error: unknown }) => ({
            backupCodeError:
                (params.error instanceof TOTPError && params.error.message) ||
                c('Error').t`Incorrect recovery code. Please try again.`,
        })),
        clearBackupCodeError: assign({ backupCodeError: undefined }),
        /** The machine's output once it reaches a final state. */
        setOutcome: assign((_, params: { outcome: Lost2FAEnd }) => ({ outcome: params.outcome })),
        reportOutcome: emit((_, params: { outcome: Lost2FAOutcome }) => ({
            type: 'lost2FA.ended' as const,
            payload: { outcome: params.outcome },
        })),
        reportError: sendParent((_, params: { error: unknown }): Lost2FAParentEvent => ({
            type: 'lost2FA.errorReported',
            payload: { error: params.error },
        })),
        /** Sending the email code failed once more on this visit. */
        countSendingAttempt: assign({ sendingAttempts: ({ context }) => context.sendingAttempts + 1 }),
        markInvalidCode: assign({ invalidCode: true }),
        clearInvalidCode: assign({ invalidCode: false }),
        notifyCodeResent: emit({ type: 'verification.codeResent' as const }),
        reportBackupCodeProvided: emit({ type: 'lost2FA.backupCodeProvided' as const }),
        reportBackupCodeAccepted: sendParent({ type: 'lost2FA.backupCodeAccepted' } satisfies Lost2FAParentEvent),
        reportPasswordResetChosen: sendParent({ type: 'lost2FA.passwordResetChosen' } satisfies Lost2FAParentEvent),
        reportBackupCodeFailed: sendParent((_, params: { error: unknown }): Lost2FAParentEvent => ({
            type: 'lost2FA.backupCodeFailed',
            payload: { error: params.error },
        })),
    },
});

/** A final state: the flow ends with this outcome, and reports it for telemetry. */
const endWith = (outcome: Lost2FAEnd) =>
    lost2FASetup.createStateConfig({
        type: 'final',
        entry: [
            { type: 'setOutcome', params: { outcome } },
            { type: 'reportOutcome', params: { outcome } },
        ],
    });

/**
 * Proves ownership of the recovery email or phone with a code, then disables two-factor authentication. The email
 * code is sent right away (with a few retries); the phone code once the user asks, since it may cost them. Back and
 * another method move along the list of methods; checking the code ignores them (see `verifying`).
 */
const verifyWithCode = (method: VerificationMethod) => {
    const screen = method === 'email' ? 'verifyOwnershipWithEmail' : 'verifyOwnershipWithPhone';
    return lost2FASetup.createStateConfig({
        entry: 'startVerification',
        on: {
            'decision.back': previousMethod(screen),
            'lost2FA.otherMethodRequested': nextMethod(screen),
        },
        initial: 'routeCode',
        states: {
            routeCode: {
                always: [
                    { guard: { type: 'hasVerificationResult', params: { method } }, target: 'awaitingCode' },
                    { target: method === 'email' ? 'sendingCode' : 'readyToSend' },
                ],
            },
            /** The phone code is only sent once the user asks. */
            readyToSend: {
                on: {
                    'verification.codeRequested': { target: 'sendingCode' },
                },
            },
            sendingCode: {
                tags: [Lost2FAStateMachineTags.submitting],
                invoke: {
                    src: 'sendVerificationCode',
                    input: { method },
                    onDone: {
                        target: 'awaitingCode',
                        actions: {
                            type: 'setVerificationResult',
                            params: ({ event }) => ({ method, verificationResult: event.output }),
                        },
                    },
                    onError:
                        method === 'email'
                            ? {
                                  target: 'sendingCodeFailed',
                                  // Reported too, so a reason from the API (such as a rate limit) shows with the retry
                                  actions: ['countSendingAttempt', reportActorError],
                              }
                            : { target: 'readyToSend', actions: reportActorError },
                },
            },
            /** Sending the email code failed; the user can try again a few times. */
            sendingCodeFailed: {
                on: {
                    'verification.sendingCodeRetried': { guard: 'canRetrySending', target: 'sendingCode' },
                },
            },
            awaitingCode: {
                initial: 'editing',
                on: {
                    'verification.codeEdited': { actions: 'clearInvalidCode' },
                },
                states: {
                    editing: {
                        on: {
                            'verification.codeSubmitted': { target: 'verifying' },
                            'verification.newCodeRequested': { target: 'newCodeDialog' },
                        },
                    },
                    /**
                     * Checks the code, then disables two-factor authentication. Back and the other methods are
                     * ignored meanwhile: by then the server may have disabled it, which leaving would hide.
                     */
                    verifying: {
                        tags: [Lost2FAStateMachineTags.submitting],
                        on: {
                            'decision.back': {},
                            'lost2FA.otherMethodRequested': {},
                        },
                        invoke: {
                            src: 'verifyCodeAndDisable2FA',
                            input: ({ context, event }) => {
                                assertEvent(event, 'verification.codeSubmitted');
                                return {
                                    method,
                                    token: context.verificationResults[method]?.token,
                                    code: event.payload.code,
                                };
                            },
                            onDone: { target: '#lost2FA.twoFactorDisabled' },
                            onError: [
                                {
                                    guard: errorOf(InvalidCodeError),
                                    target: 'editing',
                                    actions: 'markInvalidCode',
                                },
                                { target: 'editing', actions: reportActorError },
                            ],
                        },
                    },
                    /** Asks before sending another code: the first one may just be in the spam folder. */
                    newCodeDialog: {
                        tags: [Lost2FAStateMachineTags.newCodeDialog],
                        on: {
                            'verification.resendRequested': { target: 'resending' },
                            'verification.newCodeDialogClosed': { target: 'editing' },
                        },
                    },
                    /** The dialog stays open, loading, until the new code was sent. */
                    resending: {
                        tags: [Lost2FAStateMachineTags.newCodeDialog, Lost2FAStateMachineTags.resending],
                        invoke: {
                            src: 'resendVerificationCode',
                            input: ({ context }) => ({ method, token: context.verificationResults[method]?.token }),
                            onDone: {
                                target: 'editing',
                                actions: ['clearInvalidCode', 'notifyCodeResent'],
                            },
                            onError: { target: 'newCodeDialog', actions: reportActorError },
                        },
                    },
                },
            },
        },
    });
};

export const lost2FAStateMachine = lost2FASetup.createMachine({
    id: 'lost2FA',
    initial: 'routeRecoveryMethod',
    context: ({ input }) => ({
        recoveryMethods: input.recoveryMethods,
        username: input.username,
        twoFactorAuthTypes: input.twoFactorAuthTypes,
        outcome: undefined,
        backupCodeError: undefined,
        verificationResults: {},
        sendingAttempts: 0,
        invalidCode: false,
    }),
    output: ({ context }) => ({ outcome: context.outcome ?? 'returnToTwoFactor' }),

    states: {
        routeRecoveryMethod: {
            always: nextMethod(),
        },

        /** A backup code is a second factor: a valid one signs in, and the password account flow takes over. */
        requestBackupCode: {
            // A code rejected before leaving the screen doesn't show when coming back to it
            entry: 'clearBackupCodeError',
            initial: 'idle',
            on: {
                'lost2FA.backupCodeEdited': { actions: 'clearBackupCodeError' },
                'decision.back': previousMethod('requestBackupCode'),
            },
            states: {
                idle: {
                    on: {
                        'lost2FA.backupCodeSubmitted': {
                            target: 'submitting',
                            actions: ['clearBackupCodeError', 'reportBackupCodeProvided'],
                        },
                        'lost2FA.otherMethodRequested': nextMethod('requestBackupCode'),
                    },
                },
                /**
                 * Checks the code as the second factor. Back is ignored meanwhile: a valid code is used up and signs
                 * in, which leaving would drop.
                 */
                submitting: {
                    tags: [Lost2FAStateMachineTags.submitting],
                    on: {
                        'decision.back': {},
                    },
                    invoke: {
                        src: 'verifyBackupCode',
                        input: ({ event }) => {
                            assertEvent(event, 'lost2FA.backupCodeSubmitted');
                            return { code: event.payload.code };
                        },
                        onDone: {
                            target: 'reported',
                            actions: 'reportBackupCodeAccepted',
                        },
                        onError: [
                            {
                                guard: errorOf(TOTPError),
                                target: 'idle',
                                actions: {
                                    type: 'setBackupCodeError',
                                    params: ({ event }) => ({ error: event.error }),
                                },
                            },
                            {
                                target: 'reported',
                                actions: {
                                    type: 'reportBackupCodeFailed',
                                    params: ({ event }) => ({ error: event.error }),
                                },
                            },
                        ],
                    },
                },
                /**
                 * The check's outcome went to the password account flow, which carries on from there, with the form
                 * up, loading: after a valid code it finishes the sign-in, and stops this flow only if the account
                 * needs another screen first; after a failure it ends the attempt, and this flow with it.
                 */
                reported: {
                    tags: [Lost2FAStateMachineTags.submitting],
                    on: {
                        'decision.back': {},
                    },
                },
            },
        },

        verifyOwnershipWithEmail: verifyWithCode('email'),

        verifyOwnershipWithPhone: verifyWithCode('phone'),

        /** Proves ownership with the account's recovery phrase, then disables two-factor authentication. */
        verifyOwnershipWithPhrase: {
            initial: 'editing',
            on: {
                'decision.back': previousMethod('verifyOwnershipWithPhrase'),
                'lost2FA.otherMethodRequested': nextMethod('verifyOwnershipWithPhrase'),
            },
            states: {
                editing: {
                    on: {
                        'verification.phraseSubmitted': { target: 'verifying' },
                    },
                },
                /** Checks the phrase, then disables two-factor authentication; the ways out are ignored meanwhile. */
                verifying: {
                    tags: [Lost2FAStateMachineTags.submitting],
                    on: {
                        'decision.back': {},
                        'lost2FA.otherMethodRequested': {},
                    },
                    invoke: {
                        src: 'verifyPhraseAndDisable2FA',
                        input: ({ context, event }) => {
                            assertEvent(event, 'verification.phraseSubmitted');
                            return { username: context.username, phrase: event.payload.phrase };
                        },
                        onDone: { target: '#lost2FA.twoFactorDisabled' },
                        onError: { target: 'editing', actions: reportActorError },
                    },
                },
            },
        },

        twoFactorDisabled: {
            on: {
                'lost2FA.signInRequested': { target: 'signInToContinue' },
            },
        },
        signInToContinue: endWith('signInAgain'),

        noMethod: {
            on: {
                'decision.back': previousMethod('noMethod'),
                'lost2FA.passwordResetRequested': { target: 'resettingPassword' },
            },
        },
        /**
         * The password account flow leaves the page for the password reset. This flow stays on its screen, loading,
         * until the page unloads, rather than ending: nothing on the screen is then sent to a finished flow.
         */
        resettingPassword: {
            tags: [Lost2FAStateMachineTags.submitting],
            entry: [{ type: 'reportOutcome', params: { outcome: 'resetPassword' } }, 'reportPasswordResetChosen'],
        },

        returnToTwoFactor: endWith('returnToTwoFactor'),
    },
});

export type Lost2FASnapshot = SnapshotFrom<typeof lost2FAStateMachine>;

/**
 * The screen of the state the flow is in. The flow ends from the no-method and disabled screens with a page change,
 * so they stay up meanwhile; back to the two-factor screen shows it right away.
 */
export const selectLost2FAScreen = (snapshot: Lost2FASnapshot): Lost2FAScreen | undefined => {
    if (snapshot.matches('signInToContinue')) {
        return 'twoFactorDisabled';
    }
    if (snapshot.matches('resettingPassword')) {
        return 'noMethod';
    }
    return lost2FAScreens.find((screen) => snapshot.matches(screen));
};

/** The email code was sent: the screen shows the code form. */
export const selectEmailAwaitingCode = (snapshot: Lost2FASnapshot) =>
    snapshot.matches({ verifyOwnershipWithEmail: 'awaitingCode' });

/** The phone code was sent: the screen shows the code form. */
export const selectPhoneAwaitingCode = (snapshot: Lost2FASnapshot) =>
    snapshot.matches({ verifyOwnershipWithPhone: 'awaitingCode' });

/** The code sent to the recovery email, if any. */
export const selectEmailVerificationResult = ({ context }: { context: Lost2FAMachineContext }) =>
    context.verificationResults.email;

/** The code sent to the recovery phone, if any. */
export const selectPhoneVerificationResult = ({ context }: { context: Lost2FAMachineContext }) =>
    context.verificationResults.phone;

/** The flow's input; the screens read them with `useSelector`. */
export const selectLost2FAUsername = ({ context }: { context: Lost2FAMachineContext }) => context.username;

export const selectLost2FARecoveryMethods = ({ context }: { context: Lost2FAMachineContext }) =>
    context.recoveryMethods;

/** A request runs; the screen shows its loading state. */
export const selectSubmitting = (snapshot: Lost2FASnapshot) => snapshot.hasTag(Lost2FAStateMachineTags.submitting);

/** Why the last backup code was rejected, for its form. */
export const selectBackupCodeError = ({ context }: { context: Lost2FAMachineContext }) => context.backupCodeError;

/** The backup code screen waits for a code, rather than checking one. */
export const selectAwaitingBackupCode = (snapshot: Lost2FASnapshot) => snapshot.matches({ requestBackupCode: 'idle' });

/** The last verification code was wrong. */
export const selectInvalidCode = ({ context }: { context: Lost2FAMachineContext }) => context.invalidCode;

/** The code screens' new code dialog is open. */
export const selectNewCodeDialogOpen = (snapshot: Lost2FASnapshot) =>
    snapshot.hasTag(Lost2FAStateMachineTags.newCodeDialog);

/** The new code is being sent; the dialog stays open, loading. */
export const selectResending = (snapshot: Lost2FASnapshot) => snapshot.hasTag(Lost2FAStateMachineTags.resending);

/** The phone code is being sent, after the user asked. */
export const selectSendingPhoneCode = (snapshot: Lost2FASnapshot) =>
    snapshot.matches({ verifyOwnershipWithPhone: 'sendingCode' });

/** Sending the email code failed. */
export const selectEmailSendingFailed = (snapshot: Lost2FASnapshot) =>
    snapshot.matches({ verifyOwnershipWithEmail: 'sendingCodeFailed' });

/** Sending the email code can be tried again; only a few times per visit. */
export const selectCanRetrySending = (snapshot: Lost2FASnapshot) =>
    snapshot.can({ type: 'verification.sendingCodeRetried' });

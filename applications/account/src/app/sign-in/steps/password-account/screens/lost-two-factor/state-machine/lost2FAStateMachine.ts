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
    outcome: Lost2FAOutcome | undefined;
    /** Why the last backup code was rejected. */
    backupCodeError: string | undefined;
    /** The sent codes, so coming back to a method doesn't send another one. */
    verificationResults: Partial<Record<VerificationMethod, VerificationResult>>;
    /** How often sending the email code failed on this visit; the user can retry a few times. */
    sendingAttempts: number;
    /** The last code was wrong; cleared once the user edits it or a new one is sent. */
    invalidCode: boolean;
}

/** How the flow ends; the parent takes it from there. */
export type Lost2FAOutcome = 'signin to continue' | 'return to 2fa step' | 'reset password';

type Lost2FAMachineEvent =
    | { type: 'lost2FA.signInRequested' }
    | { type: 'decision.back' }
    | { type: 'lost2FA.passwordResetRequested' }
    /** From the backup code screen; checked as the second factor. */
    | { type: 'lost2FA.backupCode.submitted'; code: string }
    /** The user changed the backup code; a rejected code's message goes. */
    | { type: 'lost2FA.backupCode.edited' }
    | { type: 'lost2FA.otherMethodRequested' }
    /** The code screens (recovery email or phone). */
    | { type: 'verification.codeRequested' }
    | { type: 'verification.sendingCodeRetried' }
    /** The user changed the code; a rejected code's message goes. */
    | { type: 'verification.codeEdited' }
    | { type: 'verification.codeSubmitted'; code: string }
    /** The new code dialog: opened, confirmed, or closed. */
    | { type: 'verification.newCodeRequested' }
    | { type: 'verification.resendRequested' }
    | { type: 'verification.newCodeDialogClosed' }
    /** The recovery phrase screen. */
    | { type: 'verification.phraseSubmitted'; phrase: string };

/** Sent to the parent (the password account flow). */
export type Lost2FAParentEvent =
    /** The backup code signed in: it loads the account, and stops the flow once another screen shows. */
    | { type: 'lostTwoFactor.backupCodeAccepted' }
    /**
     * Checking the backup code failed for another reason than a wrong code, like the session the third wrong code
     * revokes: it ends the sign-in attempt, like main, and the sign-in reports the error.
     */
    | { type: 'lostTwoFactor.backupCodeFailed'; error: unknown }
    /** It forwards the error to the sign-in to show. */
    | { type: 'lostTwoFactor.errorReported'; payload: { error: unknown } };

type Lost2FAEmitted =
    /** For telemetry: every submitted backup code, and how the flow ended. */
    | { type: 'outcome'; outcome: Lost2FAOutcome | 'totp backup code provided' }
    /** The new code was sent: the code form tells the user, and clears the old code. */
    | { type: 'verification.codeResent' };

export enum Lost2FAStateMachineTags {
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
        output: {} as { outcome: Lost2FAOutcome },
        tags: {} as `${Lost2FAStateMachineTags}`,
    },
    guards: {
        hasTOTP: ({ context }) => context.twoFactorAuthTypes.totp,
        hasRecoveryEmail: ({ context }) => context.recoveryMethods.email,
        hasRecoveryPhone: ({ context }) => context.recoveryMethods.phone,
        hasRecoveryPhrase: ({ context }) => context.recoveryMethods.phrase,
        hasVerificationResult: ({ context }, params: { method: VerificationMethod }) =>
            !!context.verificationResults[params.method],
        canRetrySending: ({ context }) => context.sendingAttempts < 3,
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
        setOutcome: assign((_, params: { outcome: Lost2FAOutcome }) => ({ outcome: params.outcome })),
        reportOutcome: emit((_, params: { outcome: Lost2FAOutcome }) => ({
            type: 'outcome' as const,
            outcome: params.outcome,
        })),
        reportError: sendParent((_, params: { error: unknown }): Lost2FAParentEvent => ({
            type: 'lostTwoFactor.errorReported',
            payload: { error: params.error },
        })),
    },
});

/** A final state: the flow ends with this outcome, and reports it for telemetry. */
const endWith = (outcome: Lost2FAOutcome) =>
    lost2FASetup.createStateConfig({
        type: 'final',
        entry: [
            { type: 'setOutcome', params: { outcome } },
            { type: 'reportOutcome', params: { outcome } },
        ],
    });

/**
 * Proves ownership of the recovery email or phone with a code, then disables two-factor authentication. The email
 * code is sent right away (with a few retries); the phone code once the user asks, since it may cost them.
 * The screen's state handles back and the other methods; checking the code ignores them (see `verifying`).
 */
const verifyWithCode = (method: VerificationMethod) =>
    lost2FASetup.createStateConfig({
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
                                  actions: [
                                      assign({ sendingAttempts: ({ context }) => context.sendingAttempts + 1 }),
                                      reportActorError,
                                  ],
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
                    'verification.codeEdited': { actions: assign({ invalidCode: false }) },
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
                                return { method, token: context.verificationResults[method]?.token, code: event.code };
                            },
                            onDone: { target: '#lost2FA.twoFactorDisabled' },
                            onError: [
                                {
                                    guard: errorOf(InvalidCodeError),
                                    target: 'editing',
                                    actions: assign({ invalidCode: true }),
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
                                actions: [
                                    assign({ invalidCode: false }),
                                    emit({ type: 'verification.codeResent' as const }),
                                ],
                            },
                            onError: { target: 'newCodeDialog', actions: reportActorError },
                        },
                    },
                },
            },
        },
    });

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
    output: ({ context }) => ({ outcome: context.outcome ?? 'return to 2fa step' }),

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
                'lost2FA.backupCode.edited': { actions: 'clearBackupCodeError' },
                'decision.back': previousMethod('requestBackupCode'),
            },
            states: {
                idle: {
                    on: {
                        'lost2FA.backupCode.submitted': {
                            target: 'submitting',
                            actions: [
                                'clearBackupCodeError',
                                emit({ type: 'outcome', outcome: 'totp backup code provided' }),
                            ],
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
                            assertEvent(event, 'lost2FA.backupCode.submitted');
                            return { code: event.code };
                        },
                        onDone: {
                            target: 'accepted',
                            actions: sendParent({
                                type: 'lostTwoFactor.backupCodeAccepted',
                            } satisfies Lost2FAParentEvent),
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
                                actions: sendParent(({ event }): Lost2FAParentEvent => ({
                                    type: 'lostTwoFactor.backupCodeFailed',
                                    error: event.error,
                                })),
                            },
                        ],
                    },
                },
                /**
                 * The code signed in: the form stays up, loading, while the password account flow finishes the
                 * sign-in (like main), until it stops this flow for another screen.
                 */
                accepted: {
                    tags: [Lost2FAStateMachineTags.submitting],
                    on: {
                        'decision.back': {},
                    },
                },
            },
        },

        verifyOwnershipWithEmail: {
            entry: 'startVerification',
            on: {
                'decision.back': previousMethod('verifyOwnershipWithEmail'),
                'lost2FA.otherMethodRequested': nextMethod('verifyOwnershipWithEmail'),
            },
            ...verifyWithCode('email'),
        },

        verifyOwnershipWithPhone: {
            entry: 'startVerification',
            on: {
                'decision.back': previousMethod('verifyOwnershipWithPhone'),
                'lost2FA.otherMethodRequested': nextMethod('verifyOwnershipWithPhone'),
            },
            ...verifyWithCode('phone'),
        },

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
                            return { username: context.username, phrase: event.phrase };
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
        signInToContinue: endWith('signin to continue'),

        noMethod: {
            on: {
                'decision.back': previousMethod('noMethod'),
                'lost2FA.passwordResetRequested': { target: 'resetPassword' },
            },
        },
        resetPassword: endWith('reset password'),

        returnToTwoFactor: endWith('return to 2fa step'),
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
    if (snapshot.matches('resetPassword')) {
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

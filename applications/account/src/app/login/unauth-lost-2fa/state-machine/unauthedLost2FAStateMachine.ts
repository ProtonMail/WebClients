import { assign, setup } from 'xstate';

import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';

import { totpBackupCodeMachine } from './totpBackupCodeMachine';
import { verifyOwnershipWithEmailMachine } from './verifyOwnershipWithEmailMachine';
import { verifyOwnershipWithPhoneMachine } from './verifyOwnershipWithPhoneMachine';
import { verifyOwnershipWithPhraseMachine } from './verifyOwnershipWithPhraseMachine';

export interface Lost2FARecoveryMethods {
    email: boolean;
    phone: boolean;
    phrase: boolean;
}

interface UnauthedLost2FAMachineContext {
    recoveryMethods: Lost2FARecoveryMethods;
    username: string;
    twoFactorAuthTypes: TwoFactorAuthTypes;
    initialStep:
        | 'request totp backup codes'
        | 'verify ownership with email'
        | 'verify ownership with phone'
        | 'verify ownership with phrase'
        | 'no method to disable 2fa';
    onSubmitBackupTotpCode: (code: string) => Promise<void>;
    on2FADisabled: (username: string) => void;
    returnTo2FAStep: () => void;
    onResetPassword: (username: string) => void;
}

export type UnauthedLost2FAMachineEvent =
    | { type: 'signin to continue' }
    | { type: 'try again' }
    | { type: 'back' }
    | { type: 'reset password' };

export enum UnauthedLost2FAStateMachineTags {
    showReturnToSignIn = 'showReturnToSignIn',
}

export const unauthedLost2FAStateMachine = setup({
    types: {
        input: {} as {
            recoveryMethods: Lost2FARecoveryMethods;
            username: string;
            twoFactorAuthTypes: TwoFactorAuthTypes;
            onSubmitBackupTotpCode: (code: string) => Promise<void>;
            on2FADisabled: (username: string) => void;
            returnTo2FAStep: () => void;
            onResetPassword: (username: string) => void;
        },
        context: {} as UnauthedLost2FAMachineContext,
        events: {} as UnauthedLost2FAMachineEvent,
        tags: {} as `${UnauthedLost2FAStateMachineTags}`,
    },
    guards: {
        hasTOTP: ({ context }) => context.twoFactorAuthTypes.totp,
        hasRecoveryEmail: ({ context }) => context.recoveryMethods.email,
        hasRecoveryPhone: ({ context }) => context.recoveryMethods.phone,
        hasRecoveryPhrase: ({ context }) => context.recoveryMethods.phrase,
    },
    actors: {
        totpBackupCodeMachine,
        verifyOwnershipWithEmailMachine,
        verifyOwnershipWithPhoneMachine,
        verifyOwnershipWithPhraseMachine,
    },
}).createMachine({
    id: 'unauthedLost2FA',
    initial: 'initialRouting',
    context: ({ input }) => ({
        recoveryMethods: input.recoveryMethods,
        username: input.username,
        twoFactorAuthTypes: input.twoFactorAuthTypes,
        initialStep: 'request totp backup codes',
        onSubmitBackupTotpCode: input.onSubmitBackupTotpCode,
        on2FADisabled: input.on2FADisabled,
        returnTo2FAStep: input.returnTo2FAStep,
        onResetPassword: input.onResetPassword,
    }),

    states: {
        initialRouting: {
            always: [
                {
                    guard: 'hasTOTP',
                    target: 'request totp backup codes',
                    actions: assign({ initialStep: 'request totp backup codes' }),
                },
                {
                    guard: 'hasRecoveryEmail',
                    target: 'verify ownership with email',
                    actions: assign({ initialStep: 'verify ownership with email' }),
                },
                {
                    guard: 'hasRecoveryPhone',
                    target: 'verify ownership with phone',
                    actions: assign({ initialStep: 'verify ownership with phone' }),
                },
                {
                    guard: 'hasRecoveryPhrase',
                    target: 'verify ownership with phrase',
                    actions: assign({ initialStep: 'verify ownership with phrase' }),
                },
                {
                    target: 'no method to disable 2fa',
                    actions: assign({ initialStep: 'no method to disable 2fa' }),
                },
            ],
        },

        'request totp backup codes': {
            invoke: {
                id: 'totpBackupCodes',
                src: 'totpBackupCodeMachine',
                input: ({ context }) => ({
                    onSubmitBackupTotpCode: context.onSubmitBackupTotpCode,
                }),
                onDone: [
                    {
                        guard: ({ event }) => event.output.result === 'validated',
                        target: 'totp backup code provided',
                    },
                    {
                        guard: 'hasRecoveryEmail',
                        target: 'verify ownership with email',
                    },
                    {
                        guard: 'hasRecoveryPhone',
                        target: 'verify ownership with phone',
                    },
                    {
                        guard: 'hasRecoveryPhrase',
                        target: 'verify ownership with phrase',
                    },
                    {
                        target: 'no method to disable 2fa',
                    },
                ],
            },
            on: {
                back: { target: 'return to 2fa step' },
            },
        },

        'verify ownership with email': {
            invoke: {
                id: 'verifyOwnershipWithEmail',
                src: 'verifyOwnershipWithEmailMachine',
                onDone: [
                    {
                        guard: ({ event }) => event.output.result === 'error',
                        target: 'email ownership verification error',
                    },
                    {
                        guard: ({ event }) => event.output.result === '2fa-disabled',
                        target: '2fa-disabled',
                    },
                    {
                        guard: 'hasRecoveryPhone',
                        target: 'verify ownership with phone',
                    },
                    {
                        guard: 'hasRecoveryPhrase',
                        target: 'verify ownership with phrase',
                    },
                    {
                        target: 'no method to disable 2fa',
                    },
                ],
            },
            on: {
                back: [
                    {
                        guard: ({ context }) => context.initialStep === 'verify ownership with email',
                        target: 'return to 2fa step',
                    },
                    { target: 'request totp backup codes' },
                ],
            },
        },

        'verify ownership with phone': {
            on: {
                back: [
                    {
                        guard: ({ context }) => context.initialStep === 'verify ownership with phone',
                        target: 'return to 2fa step',
                    },
                    { guard: 'hasRecoveryEmail', target: 'verify ownership with email' },
                    { target: 'request totp backup codes' },
                ],
            },
            invoke: {
                id: 'verifyOwnershipWithPhone',
                src: 'verifyOwnershipWithPhoneMachine',
                onDone: [
                    {
                        guard: ({ event }) => event.output.result === 'error',
                        target: 'phone ownership verification error',
                    },
                    {
                        guard: ({ event }) => event.output.result === '2fa-disabled',
                        target: '2fa-disabled',
                    },
                    {
                        guard: 'hasRecoveryPhrase',
                        target: 'verify ownership with phrase',
                    },
                    {
                        target: 'no method to disable 2fa',
                    },
                ],
            },
        },

        'verify ownership with phrase': {
            on: {
                back: [
                    {
                        guard: ({ context }) => context.initialStep === 'verify ownership with phrase',
                        target: 'return to 2fa step',
                    },
                    { guard: 'hasRecoveryPhone', target: 'verify ownership with phone' },
                    { guard: 'hasRecoveryEmail', target: 'verify ownership with email' },
                    { target: 'request totp backup codes' },
                ],
            },
            invoke: {
                id: 'verifyOwnershipWithPhrase',
                src: 'verifyOwnershipWithPhraseMachine',
                onDone: [
                    {
                        guard: ({ event }) => event.output.result === 'error',
                        target: 'phrase ownership verification error',
                    },
                    {
                        guard: ({ event }) => event.output.result === '2fa-disabled',
                        target: '2fa-disabled',
                    },
                    {
                        target: 'no method to disable 2fa',
                    },
                ],
            },
        },

        'totp backup code provided': {
            type: 'final',
        },

        '2fa-disabled': {
            on: {
                'signin to continue': {
                    target: 'signin to continue',
                },
            },
        },
        'signin to continue': {
            type: 'final',
            entry: ({ context }) => context.on2FADisabled(context.username),
        },
        'email ownership verification error': {
            on: {
                'try again': {
                    target: 'verify ownership with email',
                },
            },
        },
        'phone ownership verification error': {
            on: {
                'try again': {
                    target: 'verify ownership with phone',
                },
            },
        },
        'phrase ownership verification error': {
            on: {
                'try again': {
                    target: 'verify ownership with phrase',
                },
            },
        },

        'no method to disable 2fa': {
            on: {
                back: [
                    {
                        guard: ({ context }) => context.initialStep === 'no method to disable 2fa',
                        target: 'return to 2fa step',
                    },
                    { guard: 'hasRecoveryPhrase', target: 'verify ownership with phrase' },
                    { guard: 'hasRecoveryPhone', target: 'verify ownership with phone' },
                    { guard: 'hasRecoveryEmail', target: 'verify ownership with email' },
                    { target: 'request totp backup codes' },
                ],
                'reset password': { target: 'reset password' },
            },
        },

        'reset password': {
            type: 'final',
            entry: ({ context }) => context.onResetPassword(context.username),
        },

        'return to 2fa step': {
            type: 'final',
            entry: ({ context }) => context.returnTo2FAStep(),
        },
    },
});

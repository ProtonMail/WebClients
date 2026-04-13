import { setup } from 'xstate';

import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';

import { totpBackupCodeMachine } from './totpBackupCodeMachine';
import { verifyOwnershipWithEmailMachine } from './verifyOwnershipWithEmailMachine';
import { verifyOwnershipWithPhoneMachine } from './verifyOwnershipWithPhoneMachine';

export interface Lost2FARecoveryMethods {
    email: boolean;
    phone: boolean;
}
interface UnauthedLost2FAMachineContext {
    recoveryMethods: Lost2FARecoveryMethods;
    username: string;
    twoFactorAuthTypes: TwoFactorAuthTypes;
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
    },
    actors: {
        totpBackupCodeMachine,
        verifyOwnershipWithEmailMachine,
        verifyOwnershipWithPhoneMachine,
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QFcB2BDZAXAFpAYgPYBOUhWATPgIIB0xYAjsnFgARbkAObARugGMA1sh4DCEOAGIIhVGFoBLVADdCQhZyxcAQoJFcAwhLgBtAAwBdRKC6FYirIrk2QAD0QAWAMwAOWuaB5t7mAKwAjADsoZG+4QA0IACeiACc-ua+3tk5udkAvvmJaJi4BCRklDT0TCyw7Fo8-MKibOKSsDJyCspqGrSNei1GJrCm4dZIIHYOTi5THgg+GUEhEdGxCcmI4TG0WXmH4YVFIKijriXYeBBEpORU1K4zjs6orosAtABsiSkIP0KxQw13K9yqdAYzFYHG4fH0rXacGe9le81Ai08FD+iDitFCQJAVzKtwqD2qKjAxEUADMkmxCAB3eTEWA4RQ8RmOHBsMAAW3QigANijZm8PohIpFwrRIt9QvLQusYnEcQhdt99ocjoTiTc7pVHgM4c0DG0TGwuMRCCpFJIIKK0e8FpLpbL5YrlZs1alQlrtXkTvkgA */
    id: 'unauthedLost2FA',
    initial: 'request totp backup codes',
    context: ({ input }) => ({
        recoveryMethods: input.recoveryMethods,
        username: input.username,
        twoFactorAuthTypes: input.twoFactorAuthTypes,
        onSubmitBackupTotpCode: input.onSubmitBackupTotpCode,
        on2FADisabled: input.on2FADisabled,
        returnTo2FAStep: input.returnTo2FAStep,
        onResetPassword: input.onResetPassword,
    }),

    states: {
        'request totp backup codes': {
            invoke: {
                id: 'totpBackupCodes',
                src: 'totpBackupCodeMachine',
                input: ({ context }) => ({
                    twoFactorAuthTypes: context.twoFactorAuthTypes,
                    onSubmitBackupTotpCode: context.onSubmitBackupTotpCode,
                }),
                onDone: [
                    {
                        guard: ({ event }) => event.output.result === 'validated',
                        target: 'totp backup code provided',
                    },
                    {
                        target: 'verify ownership with email',
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
                input: ({ context }) => ({
                    hasRecoveryEmail: context.recoveryMethods.email,
                }),
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
                        target: 'verify ownership with phone',
                    },
                ],
            },
            on: {
                back: [
                    {
                        guard: 'hasTOTP',
                        target: 'request totp backup codes',
                    },
                    {
                        target: 'return to 2fa step',
                    },
                ],
            },
        },

        'verify ownership with phone': {
            on: {
                back: [
                    {
                        guard: 'hasRecoveryEmail',
                        target: 'verify ownership with email',
                    },
                    {
                        guard: 'hasTOTP',
                        target: 'request totp backup codes',
                    },
                    {
                        target: 'return to 2fa step',
                    },
                ],
            },
            invoke: {
                id: 'verifyOwnershipWithPhone',
                src: 'verifyOwnershipWithPhoneMachine',
                input: ({ context }) => ({ hasRecoveryPhone: context.recoveryMethods.phone }),
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

        'no method to disable 2fa': {
            on: {
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

import { assign, setup } from 'xstate';

import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';

import { totpBackupCodeMachine } from './totpBackupCodeMachine';
import { type EmailVerificationResult, verifyOwnershipWithEmailMachine } from './verifyOwnershipWithEmailMachine';
import { type SMSVerificationResult, verifyOwnershipWithPhoneMachine } from './verifyOwnershipWithPhoneMachine';
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
    smsVerificationResult: SMSVerificationResult | null;
    emailVerificationResult: EmailVerificationResult | null;
}

export type UnauthedLost2FAMachineEvent =
    | { type: 'signin to continue' }
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
    /** @xstate-layout N4IgpgJg5mDOIC5QFcB2BDZAXAFpAMgPaxYBMAYgIIB0AlqrVregDYBKh29UAxANoAGALqJQAB2KNahVKJAAPRKQEDqAgBwBGUgFZNAFk06AbDv0B2dQBoQAT0SaBO0moGb1ATg8D9+gMykpAC+QTZomLgExGRUdAxMrBxcqLx8miJIIBKwUjJyigjKqhraeoYmZpY29oWkptSk+qSa5qTq+uoaHjohYRjYeBBEJBQ09FKJnEwp-KQZ4pJMeZkFRWpaugZGphbWdohaah5+5jpereYeRj2hIOEDUSOx4wnsU9z8fvNZi9KyK0oVOtSlsKrtqko-CZqH5uqQPJ1zJZjMZ1L07v1IkNoqM4hM3slUvpvtlcv9QKsgSVNuUdlV9oVfOZqGZ2qQ-H4BOZjL50fcscMYjQAE5gACOyDgWAABFhCFgxNKAEboADGAGtkIrVYQIHAeBAZGA4gA3Qjq41yhUAITVmrEAGFdXBBCTfssKQcPPoWf5LE1usZNLCIQhHOZVM0dDo-MZYzGWmjbvzBoLcaKJVLZfLFSqNVrpTq9bADUbTebLTnbfnHc7YGk3TkluSFF6fWYTmzA8GPKHNO4XFo-JovEzSn4+ZjUzjYhnJSRswrlXaC0X9YbUMb6GaLdQrWJq-ancW+HM5KTm-k277OwGTD3Q-oedRTkZzAZLij2Tc+hFp08RXFecZX3Zca0LOtS03ctd33Q8tWPF0vnPd0WwKTx2z9Lt7xDBkRzaahTGMRpUROZweUnP9HiFag5yzUC83tCDiygrdUB3SsbRXWsT2JFCmz+K8EAwm9-XhHDewZZpUQaE59A8ZQUUcWNKIebEANooD6JzMCmLXEtGNdfiySEkSOzE7tcJqQIXBaAQAl0dRuU6dxVIFGcaBNMBhVoAAzWxpUIAB3TdhVgHBaEVILGBwaUwAAW3QWgWFYmDjS8nz-IAeRC7zwsigB1GKAFFEuSozMgvQSATDcwLGodRmg8blTgUnR1GMUM4z8BrzD8XwBHZdQTiuNz-xojK-IC4LQvyqKYrisqUo3NiOOoSbstysKIrEIrcFKpKWAbYzLxqlp6sakcWrORzOoZS4eqDLs2h0DR1CTX81LTWINumra5ulaLcEWw7Uu3Ct1u8qactmna9pwA7yrPSrUKE87mUu5rjFa26+2DFw9CuU5Xs6PxPDG6jcV+wL-p2wGFoS0GVrSyHMtsGG8rhkqlr4ZCUYEj1W1qi6muutqOr7ZwXA8YiOh5BERxMCn1ImqH-Jp2HIvp4HGeSnhDOEE7qs9YWMdF7Gbvau6ancARjEI7ZmgsEx2mV77PLVv7NfmnWlv1u1jv5kyzuUmF32OYdWhUUg8YCF9hzhMnUX0HRzDdjzWamjXOa1oHYrEHAjTB9iId+jntsKmKAAVC83CqFgFtDEChYwPAaCx+yceTrcQU5pYMO2R1jLQ43TjTqZmnOffz2uwGLtay9pyvcBro1A4b4OTbqYxVB3tw6t0CN4T8PtmhcNx9CcQbXr6iwx9Vtns4r6fpQLovmfB3dF+9+HV7r5GN6nRNi3NujR3yODMDLUM6hXpqG5NGdkxxmo+HvlTT2T8AZ51frPf2Gp64-EbkJEB7dwFdygfdLw1AvAxicByWM3gPoYioirNBj9J7P21jPIuhl0hG0FqsdoOhqD9k8LGZQXhhwxwZIGeOAhvRcgCH6H8TCvoZwnkvF+b9Ny4PVKeRsm8hbwkaC+ZBKIZbsn8KGfqLh3xyKfP2SwI4ZaoJ+ug9hmCFoF2FOgWAc8P4ly-p7cuc1f44G8b4-BVV+FKBRLvFQ51D6DWOH2O2PokT2W0H1DkbhNAuI9mwjRnDsHhL8WWT+6UgkaNCSU9eBCDGrFiYReJB9U5JJPnhTkPoUTvhgYERq7JgjJinJTVxBTvZFK8T4ueBt9FAMMY0veCTWnHzxv2BqehoxBk5C0JWQzmHu0zurdxdMsGTN8To2pUSm6FAWc0poyzkl4U0EGKhARSYjh8AgvJhyvZTwmWEqZFyAF1LmQUfC9sO5eC8C0WMGhT66GEa0YcPgYHOD6t89R4zTkAvOYZPmgDjaGJUPbIwbhORmKRHUUM7UeqXCapHTo1DvmkF8ugAAtBAWgsB0BKhYJAHgOQoAMFQNmCCqBpiSkiajGqTRYRh2cGRJFgQdBdX8O3VEWSoTPLMN81AhBpTxTALgXUorOXct5WAaULL0AXMNkHUFiBZVtzIuyU4SrdB9k6dQFO9kNC0NMI0XV+rDXGogKarlPK+VWtZRc3h9rCUFHjPbDJKdSCWCvi0PssqXxck6K3beO99BBoNUawuYa5TSjNZGy11qgWzITc3UwbdhqUs5OJLQoZvQ2PhBqk4Bh2qMJTCMmgeqS2hvDeaqNta8X1uiQgWM9QnDdA6rYp6fZUTJrqucb00ZfATj2aojSo6Q1londW6NNrDJ8XjXOuSaSTjvjqnGJJPdCg+BJTLDq2MfB1FyQe9yR7g2lpNRWqtFqL08FFL4mUYgfGwCCoQYUEApWEJlYg+VrrU4DI9R0swLJhzRj0D2AIIRbh6uLHIIdLCqB8OuWy19bKhFQuYyxhExhvkvGYASaYUBaNCSaKGPpm73CghHLyf9410xaQXAxbizE4B8ZlTGFkr0VDNUsMOfwKq8I+GKBybQzQ5EjkHcM6j+Ss7HNzgzJaimTbBmeQ1NoyhAiGG6ApPGBEt3HF0G0bGd8JPDp+Rgk5njZ62aFgR9QDQYwch3gETkThQxImbV4UwrQhrKCLQFszQXLOaJxWAcLqx0M7zjOcWErRyE2y2MIjo7RUv9UMPuz6AGaKyfAmuV+wpCAmloHqCARWHDDnto1Rqg1GiK3czp7GL5iJkyhAiYaOrssHOtRyiNFqBs3uuZfAiHQYzecamcVVPUzB2zTSoYaabmsqNa7iQVwrRU6nFfQSUg2EC+DON6+ysYDClZwzbZowiJG7a2J4ORxaT0gf1WBqdrL3uXw0MD2EHUYzwicp6tZRhP2vW0BYFSK2M5QaNa-ODCGkMI5Tm3S+sW-vne0zbbJDQtCpzjL4DCJn9lE6NcgYUIqK3WulCQMAYhKdfZp79p89PBOecRCnLVTRuRZZCEAA */
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
        smsVerificationResult: null,
        emailVerificationResult: null,
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
                input: ({ context }) => ({
                    verificationResult: context.emailVerificationResult,
                }),
                onDone: [
                    {
                        guard: ({ event }) => event.output.result === '2fa-disabled',
                        target: '2fa-disabled',
                    },
                    {
                        guard: 'hasRecoveryPhone',
                        target: 'verify ownership with phone',
                        actions: assign({ emailVerificationResult: ({ event }) => event.output.verificationResult }),
                    },
                    {
                        guard: 'hasRecoveryPhrase',
                        target: 'verify ownership with phrase',
                        actions: assign({ emailVerificationResult: ({ event }) => event.output.verificationResult }),
                    },
                    {
                        target: 'no method to disable 2fa',
                        actions: assign({ emailVerificationResult: ({ event }) => event.output.verificationResult }),
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
                input: ({ context }) => ({
                    verificationResult: context.smsVerificationResult,
                }),
                onDone: [
                    {
                        guard: ({ event }) => event.output.result === '2fa-disabled',
                        target: '2fa-disabled',
                    },
                    {
                        guard: 'hasRecoveryPhrase',
                        target: 'verify ownership with phrase',
                        actions: assign({ smsVerificationResult: ({ event }) => event.output.verificationResult }),
                    },
                    {
                        target: 'no method to disable 2fa',
                        actions: assign({ smsVerificationResult: ({ event }) => event.output.verificationResult }),
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

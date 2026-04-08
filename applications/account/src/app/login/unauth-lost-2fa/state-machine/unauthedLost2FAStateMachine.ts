import { setup } from 'xstate';

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
    /** @xstate-layout N4IgpgJg5mDOIC5QFcB2BDZAXAFpAMgPaxYBMAYgIIB0ATmAI7JxYAEWhWADqwEboBjANbIeAwhDgBiCIVRhqAS1QA3QkIUduAIUEiuAYQlwA2gAYAuolBdiirIrnWQAD0SkAjADYv1L2Y8AVgCAFi8QgA4QgGYIgBoQAE9ED1SzakDorOycrIBfPIS0TFwCYjIqOkZmEnZOHn5hUVZxSVgZOQVlNQ1qLS5dJsNjWBMPKyQQW1h7R1RnNwRPHz8A4I8wyJj4pMQI0kCMiNzckIKijGw8CCISChp6JhY67j49ZtbpRqFzCZs7BxOSaLZa+fxBULhKKxBLJBAeUikACcGROJ3OIGKVzKd0qKjAtEUADNEqxCAB3eS0WA4RQ8cn2HCsMAAW3QigANh15EpVOoFPjCSSAPKUgk0ukAdUZAFE2Zzfs5prMgaAQUiIh5qNEzCFAkj9SEAOykLyBLywvYhELUI1o3IYrGlG7le7UQXE0kUqkS+mM5nyrmyHndfnugme0U+2lcaW4OXsjljP5TAFzBbuDVanV6g1I42m82WhBGsK2+05R2XZ23Co0D0ksli6kx1gM3ABxPcrp83oNxJR8UxuM4BMK0gp5WA+bA9zeMFrSFbGG7EukI1HCvRM6FTHV661t39pvRult-2srvfRWTKfp2dLbeHQJGiJmLzRJFQ7bFo1Gw5mMcFY7hcJQHq6eIRo23pDme7ZMpenJSNe4xKmmqquJmmrarq+qGiaZoWquERIqQ1CkFu+S7k64G4vWUFes2vrnh2XA4J03a8j0AoMYOLZSoyAAK7HyDe-wzNOGbwtEXhauCmQeBqpAhJ4SLFsaKLBGY2k6bp75VmBOJ1uGQqMaefqsSJYCcaGfa8Uxw5CVZyZoRJ95qikMlyWs0SKfsKmKcWgQvtQQHAQZ2IunRJmeiesEWUybEccGPbcTFIoOQJuDCZ0JgTq5Kozh5CCBKQ6TyV4BzqSEKLRIEITzj4TVeKWEU1hB9GmXF-EJawSXyMhehiambkYYsHheasQS+UpAVqau-iHJR25tbRxnHjBPUsYlVmDcILm3uhRWYdJslTQps2qcWHhmK+2qUYEq1GUeDHdcx8F9bt175Ydo3HeNk3yTN-lXauE3BORYX2k9UXra9m3vf6bG0OgsDWSlXFhv2fG+iOwko2jw13mNiCBBN13RKQMOHpBXUI62H3I6j6OdJjdmmTjjnZTgBNgAd4mFVJZPRMWnjpMtK3Ufuz207F9NwUjPPMzZvY8RzmWxk5vN5ZOR1C+Tq51Uty1GtTHXpWZ8XbZ9vN7T8lgFZJD7C+pX6hfVjXNS1IF7oZsMvXTGvW0zaN2-zI2C87Btwvm0T3VuPs0TLnVy0HjNK6H32639+si2DikooBW6PVLfs0yn0Fp4rtvXtE2eR8VLtg8aWpmMtZvRaQRLoAAtBAiiwOgvAcpAUgzFAqDKHULRyA4qDMETesPjJRq+Ma4QhLqyJeBE-5Bea8fhaXkXl9QiEcm9rYNooAjoNOzK0LQhC0FIWC0KS6BQOyqCLzny-KWRd8FE-ykS-LvQIv58zkXbsfdq0V+pgEvmea+t974Eifi-N+H8v7KF-g3E63hSARD8JEaIq9NjQh2HCFShc9J0P0rAtaboQ6IPljwFBd85gPwwa-d+rBP7fzwU7Yqr447fnfJdQKxEtQl1Aifc2qBCCsBZGAXAEhp790HsPRBXd0BSHoGjNgXBUawHJM-CAQj3IEMBj5PyACpFwjqnHKG9pTYYkUW0ZwSd-ZUEdlYxYPciJwkCR3YyjwahsH6G8IYM9PG-XweNf8hx5JLkoddd8Noi4Vlkb7eR0UNpVw7OfPxJMljmnFrhPMBZCK-j1NQLJ9pE7Sx8RXS2W106dBKf9RASIbrnWBvY+a1DtzUBiP+eh2kvChIDqncywcM5gC6VJFSxYSLammZUKJ3wPjGD6k-FQihJAQCWQ+A4-gcK5nwoWIJKQbrEKIZRDZNBdF9wHkPEexz4nCJOtuIIGQjQBCRFvMBe9VzBV8C4k4TSy7m3HpPVA09xCoDnswE5xVYheELq+bSyJt7gKCpTepkKcjQrycZc+SD2FQRvpwuQ3Dn5op+WQwuQRgi4pBRA4iZgyKai9l7Nxci4HGQQZS1gHC0GPwZV8-xKQknnVST+VcYzNxbgFbkoVzCFmivFVw9BUqBbfMWL08qtjJFDJ6ekBpFYnnUEUco1R7EIAaLedo1gujGVGt6baTI4C7SDOLHVG0Es1XeNPgY1RfUTFmNoJ8g1Mr4RypSRsb8K5HHIhVRWENzSw2qOQLQBFHA3Xd1YCQMAXAPWICyEaFlwVuWgJ3qCuECINgZuhgUPIQA */
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
                        target: 'verify ownership with phrase',
                    },
                ],
            },
        },

        'verify ownership with phrase': {
            on: {
                back: [
                    {
                        guard: 'hasRecoveryPhone',
                        target: 'verify ownership with phone',
                    },
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
                id: 'verifyOwnershipWithPhrase',
                src: 'verifyOwnershipWithPhraseMachine',
                input: ({ context }) => ({ hasRecoveryPhrase: context.recoveryMethods.phrase }),
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
                        guard: 'hasRecoveryPhrase',
                        target: 'verify ownership with phrase',
                    },
                    {
                        guard: 'hasRecoveryPhone',
                        target: 'verify ownership with phone',
                    },
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

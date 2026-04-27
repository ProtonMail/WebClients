import { type ActorRefFrom, assign, setup } from 'xstate';

import type { VerificationDataResult } from '@proton/components/index';

type Result = '2fa-disabled' | 'skipped';

export interface EmailVerificationResult {
    verificationDataResult: VerificationDataResult;
    token: string;
}

interface MachineContext {
    result: Result | null;
    verificationResult: EmailVerificationResult | null;
    initiationAttempts: number;
}

interface MachineOutput {
    result: Result;
    verificationResult: EmailVerificationResult | null;
}

type MachineEvent =
    | { type: '2fa disabled' }
    | { type: 'try another way' }
    | { type: 'verification initiated'; verificationResult: EmailVerificationResult }
    | { type: 'initiation failed' }
    | { type: 'retry initiation' };

export type VerifyOwnershipWithEmailActorRef = ActorRefFrom<typeof verifyOwnershipWithEmailMachine>;

export const verifyOwnershipWithEmailMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvent,
        output: {} as MachineOutput,
        input: {} as {
            verificationResult: EmailVerificationResult | null;
        },
    },
    guards: {
        canRetry: ({ context }) => context.initiationAttempts < 3,
    },
}).createMachine({
    id: 'verifyOwnershipWithEmail',
    initial: 'verify code',
    context: ({ input }) => ({
        result: null,
        verificationResult: input.verificationResult,
        initiationAttempts: 0,
    }),
    output: ({ context }): MachineOutput => ({
        result: context.result!,
        verificationResult: context.verificationResult,
    }),
    states: {
        'verify code': {
            on: {
                '2fa disabled': {
                    target: '2fa disabled',
                },
                'try another way': {
                    target: 'skipped',
                },
                'verification initiated': {
                    actions: assign({ verificationResult: ({ event }) => event.verificationResult }),
                },
                'initiation failed': {
                    target: 'initiation failed',
                    actions: assign({ initiationAttempts: ({ context }) => context.initiationAttempts + 1 }),
                },
            },
        },
        'initiation failed': {
            on: {
                'retry initiation': {
                    guard: 'canRetry',
                    target: 'verify code',
                },
                'try another way': {
                    target: 'skipped',
                },
            },
        },
        '2fa disabled': {
            type: 'final',
            entry: assign({ result: '2fa-disabled' }),
        },
        skipped: {
            type: 'final',
            entry: assign({ result: 'skipped' }),
        },
    },
});

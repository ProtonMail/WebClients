import { type ActorRefFrom, assign, setup } from 'xstate';

import type { VerificationDataResult } from '@proton/components/index';

type Result = '2fa-disabled' | 'skipped' | 'error';

export interface EmailVerificationResult {
    verificationDataResult: VerificationDataResult;
    token: string;
}

interface MachineContext {
    result: Result | null;
    verificationResult: EmailVerificationResult | null;
}

interface MachineOutput {
    result: Result;
    verificationResult: EmailVerificationResult | null;
}

type MachineEvent =
    | { type: '2fa disabled' }
    | { type: 'try another way' }
    | { type: 'error' }
    | { type: 'verification initiated'; verificationResult: EmailVerificationResult };

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
}).createMachine({
    id: 'verifyOwnershipWithEmail',
    initial: 'verify code',
    context: ({ input }) => ({
        result: null,
        verificationResult: input.verificationResult,
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
                error: {
                    target: 'error',
                },
                'verification initiated': {
                    actions: assign({ verificationResult: ({ event }) => event.verificationResult }),
                },
            },
        },
        '2fa disabled': {
            type: 'final',
            entry: assign({ result: '2fa-disabled' }),
        },
        error: {
            type: 'final',
            entry: assign({ result: 'error' }),
        },
        skipped: {
            type: 'final',
            entry: assign({ result: 'skipped' }),
        },
    },
});

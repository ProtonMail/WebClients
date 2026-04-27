import { type ActorRefFrom, assign, setup } from 'xstate';

import type { VerificationDataResult } from '@proton/components/index';

type Result = '2fa-disabled' | 'skipped';

export interface SMSVerificationResult {
    verificationDataResult: VerificationDataResult;
    token: string;
}

interface MachineContext {
    result: Result | null;
    verificationResult: SMSVerificationResult | null;
}
interface MachineOutput {
    result: Result;
    verificationResult: SMSVerificationResult | null;
}

type MachineEvent =
    | { type: '2fa disabled' }
    | { type: 'try another way' }
    | { type: 'verification initiated'; verificationResult: SMSVerificationResult };

export type VerifyOwnershipWithPhoneActorRef = ActorRefFrom<typeof verifyOwnershipWithPhoneMachine>;

export const verifyOwnershipWithPhoneMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvent,
        output: {} as MachineOutput,
        input: {} as {
            verificationResult: SMSVerificationResult | null;
        },
    },
}).createMachine({
    id: 'verifyOwnershipWithPhone',
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
                'verification initiated': {
                    actions: assign({ verificationResult: ({ event }) => event.verificationResult }),
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

import { type ActorRefFrom, assign, setup } from 'xstate';

type Result = 'no-phone-method' | '2fa-disabled' | 'skipped' | 'error';

interface MachineContext {
    hasRecoveryPhone: boolean;
    result: Result | null;
}

type MachineEvent = { type: '2fa disabled' } | { type: 'try another way' } | { type: 'error' };

export type VerifyOwnershipWithPhoneActorRef = ActorRefFrom<typeof verifyOwnershipWithPhoneMachine>;

export const verifyOwnershipWithPhoneMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvent,
        input: {} as { hasRecoveryPhone: boolean },
        output: {} as { result: Result },
    },
    guards: {
        hasRecoveryPhone: ({ context }) => context.hasRecoveryPhone,
    },
}).createMachine({
    id: 'verifyOwnershipWithPhone',
    initial: 'validating',
    context: ({ input }) => ({
        hasRecoveryPhone: input.hasRecoveryPhone,
        result: null,
    }),
    output: ({ context }): { result: Result } => ({ result: context.result! }),
    states: {
        validating: {
            always: [{ guard: 'hasRecoveryPhone', target: 'verify code' }, { target: 'no phone method' }],
        },
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
            },
        },
        'no phone method': {
            type: 'final',
            entry: assign({ result: 'no-phone-method' }),
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

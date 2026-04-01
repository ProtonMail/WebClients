import { type ActorRefFrom, assign, setup } from 'xstate';

type Result = 'no-email-method' | '2fa-disabled' | 'skipped' | 'error';

interface MachineContext {
    hasRecoveryEmail: boolean;
    result: Result | null;
}

type MachineEvent = { type: '2fa disabled' } | { type: 'try another way' } | { type: 'error' };

export type VerifyOwnershipWithEmailActorRef = ActorRefFrom<typeof verifyOwnershipWithEmailMachine>;

export const verifyOwnershipWithEmailMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvent,
        input: {} as { hasRecoveryEmail: boolean },
        output: {} as { result: Result },
    },
    guards: {
        hasRecoveryEmail: ({ context }) => context.hasRecoveryEmail,
    },
}).createMachine({
    id: 'verifyOwnershipWithEmail',
    initial: 'validating',
    context: ({ input }) => ({
        hasRecoveryEmail: input.hasRecoveryEmail,
        result: null,
    }),
    output: ({ context }): { result: Result } => ({ result: context.result! }),
    states: {
        validating: {
            always: [{ guard: 'hasRecoveryEmail', target: 'verify code' }, { target: 'no email method' }],
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
        'no email method': {
            type: 'final',
            entry: assign({ result: 'no-email-method' }),
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

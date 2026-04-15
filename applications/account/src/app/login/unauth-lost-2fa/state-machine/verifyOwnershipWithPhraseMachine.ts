import { type ActorRefFrom, assign, setup } from 'xstate';

type Result = 'no-phrase-method' | '2fa-disabled' | 'skipped' | 'error';

interface MachineContext {
    hasRecoveryPhrase: boolean;
    result: Result | null;
}

type MachineEvent = { type: '2fa disabled' } | { type: 'try another way' } | { type: 'error' };

export type VerifyOwnershipWithPhraseActorRef = ActorRefFrom<typeof verifyOwnershipWithPhraseMachine>;

export const verifyOwnershipWithPhraseMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvent,
        input: {} as { hasRecoveryPhrase: boolean },
        output: {} as { result: Result },
    },
    guards: {
        hasRecoveryPhrase: ({ context }) => context.hasRecoveryPhrase,
    },
}).createMachine({
    id: 'verifyOwnershipWithPhrase',
    initial: 'validating',
    context: ({ input }) => ({
        hasRecoveryPhrase: input.hasRecoveryPhrase,
        result: null,
    }),
    output: ({ context }): { result: Result } => ({ result: context.result! }),
    states: {
        validating: {
            always: [{ guard: 'hasRecoveryPhrase', target: 'verify phrase' }, { target: 'no phrase method' }],
        },
        'verify phrase': {
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
        'no phrase method': {
            type: 'final',
            entry: assign({ result: 'no-phrase-method' }),
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

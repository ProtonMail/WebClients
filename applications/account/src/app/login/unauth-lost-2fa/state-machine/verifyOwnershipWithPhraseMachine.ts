import { type ActorRefFrom, assign, setup } from 'xstate';

type Result = '2fa-disabled' | 'skipped' | 'error';

interface MachineContext {
    result: Result | null;
}

type MachineEvent = { type: '2fa disabled' } | { type: 'try another way' } | { type: 'error' };

export type VerifyOwnershipWithPhraseActorRef = ActorRefFrom<typeof verifyOwnershipWithPhraseMachine>;

export const verifyOwnershipWithPhraseMachine = setup({
    types: {
        context: {} as MachineContext,
        events: {} as MachineEvent,
        output: {} as { result: Result },
    },
}).createMachine({
    id: 'verifyOwnershipWithPhrase',
    initial: 'verify phrase',
    context: {
        result: null,
    },
    output: ({ context }): { result: Result } => ({ result: context.result! }),
    states: {
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

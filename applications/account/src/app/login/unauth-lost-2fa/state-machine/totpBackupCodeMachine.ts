import { c } from 'ttag';
import { type ActorRefFrom, assign, fromPromise, setup } from 'xstate';

type Result = 'skipped' | 'validated';

interface TotpBackupCodeMachineContext {
    onSubmitBackupTotpCode: (code: string) => Promise<void>;
    code: string | null;
    error: string | null;
    result: Result | null;
}

type MachineEvent = { type: 'try another way' } | { type: 'backup code submitted'; code: string };

export type TotpBackupCodesActorRef = ActorRefFrom<typeof totpBackupCodeMachine>;

export const totpBackupCodeMachine = setup({
    types: {
        context: {} as TotpBackupCodeMachineContext,
        events: {} as MachineEvent,
        input: {} as {
            onSubmitBackupTotpCode: (code: string) => Promise<void>;
        },
        output: {} as { result: Result },
    },
    actors: {
        onSubmitBackupTotpCode: fromPromise(
            async ({ input }: { input: { code: string; onSubmitBackupTotpCode: (code: string) => Promise<void> } }) => {
                await input.onSubmitBackupTotpCode(input.code);
            }
        ),
    },
}).createMachine({
    id: 'totpBackupCodes',
    initial: 'request backup code',
    context: ({ input }) => ({
        onSubmitBackupTotpCode: input.onSubmitBackupTotpCode,
        code: null,
        error: null,
        result: null,
    }),
    output: ({ context }): { result: Result } => {
        return { result: context.result! };
    },
    states: {
        'request backup code': {
            on: {
                'backup code submitted': {
                    target: 'submitting',
                    actions: assign(({ event }) => ({
                        code: event.code,
                        error: null,
                    })),
                },
                'try another way': {
                    target: 'skipped',
                },
            },
        },
        submitting: {
            invoke: {
                src: 'onSubmitBackupTotpCode',
                input: ({ context }) => ({
                    code: context.code!,
                    onSubmitBackupTotpCode: context.onSubmitBackupTotpCode,
                }),
                onDone: {
                    target: 'validated',
                },
                onError: {
                    target: 'request backup code',
                    actions: assign(({ event }) => ({
                        error:
                            (event.error as Error)?.message ?? c('Error').t`Incorrect recovery code. Please try again.`,
                    })),
                },
            },
        },
        validated: {
            type: 'final',
            entry: assign({ result: 'validated' }),
        },
        skipped: {
            type: 'final',
            entry: assign({ result: 'skipped' }),
        },
    },
});

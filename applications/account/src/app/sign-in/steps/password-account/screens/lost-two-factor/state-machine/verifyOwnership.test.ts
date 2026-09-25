import { type ActorRefFrom, createActor, fromPromise, setup, waitFor } from 'xstate';

import { InvalidCodeError } from '@proton/shared/lib/authentication/error';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces';

import {
    type Lost2FAParentEvent,
    type Lost2FARecoveryMethods,
    type VerificationMethod,
    type VerificationResult,
    lost2FAStateMachine,
    selectLost2FAScreen,
} from './lost2FAStateMachine';
import { createVerificationActors } from './verificationActors';

const verificationResult = {
    token: 'token',
    verificationDataResult: { ChallengeDestination: 'r***@example.com' },
} as unknown as VerificationResult;

// The recovery phrase check's crypto; these tests only look at its requests
jest.mock('@proton/shared/lib/mnemonic', () => ({
    mnemonicToBase64RandomBytes: () => Promise.resolve('random-bytes'),
}));
jest.mock('@proton/shared/lib/srp', () => ({
    srpAuth: ({ api, config }: { api: Api; config: object }) => api(config),
}));

const invalidCodeError = new InvalidCodeError('Invalid code');

/** A promise the test settles by hand, to control when a request finishes. */
const deferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

type Flow = ActorRefFrom<typeof lost2FAStateMachine>;

/**
 * Runs the lost-2FA flow as the password account flow does: as a child, whose reported errors the parent collects.
 * With only the given recovery methods (and no authenticator app, unless `totp`) it opens on the first one's screen.
 */
const runFlow = (logic: typeof lost2FAStateMachine, recoveryMethods: Partial<Lost2FARecoveryMethods>, totp = false) => {
    const errors: unknown[] = [];
    const parent = setup({
        types: { events: {} as Lost2FAParentEvent },
        actors: { lost2FA: logic },
    }).createMachine({
        invoke: {
            id: 'lost2FA',
            src: 'lost2FA',
            input: {
                recoveryMethods: { email: false, phone: false, phrase: false, ...recoveryMethods },
                username: 'member@example.com',
                twoFactorAuthTypes: { enabled: true, totp, fido2: false },
            },
        },
        on: {
            'lostTwoFactor.errorReported': { actions: ({ event }) => errors.push(event.payload.error) },
        },
    });
    const actor = createActor(parent).start();
    const flow = actor.getSnapshot().children.lost2FA as Flow;
    return { flow, errors };
};

/** A state of the email or phone code screen, as `snapshot.matches` takes it under the screen's state. */
type CodeState =
    'readyToSend' | 'sendingCodeFailed' | { awaitingCode: 'editing' | 'verifying' | 'newCodeDialog' | 'resending' };

const isAt = (flow: Flow, method: VerificationMethod, state: CodeState) =>
    method === 'email'
        ? flow.getSnapshot().matches({ verifyOwnershipWithEmail: state })
        : flow.getSnapshot().matches({ verifyOwnershipWithPhone: state });

const untilAt = (flow: Flow, method: VerificationMethod, state: CodeState) =>
    waitFor(flow, () => isAt(flow, method, state));

const startCode = (
    method: VerificationMethod,
    {
        sendVerificationCode = () => Promise.resolve(verificationResult),
        resendVerificationCode = () => Promise.resolve(),
        verifyCodeAndDisable2FA = () => Promise.resolve(),
        recoveryMethods = {},
    }: {
        sendVerificationCode?: (input: { method: VerificationMethod }) => Promise<VerificationResult>;
        resendVerificationCode?: () => Promise<void>;
        verifyCodeAndDisable2FA?: (input: {
            method: VerificationMethod;
            token: string | undefined;
            code: string;
        }) => Promise<void>;
        recoveryMethods?: Partial<Lost2FARecoveryMethods>;
    } = {}
) => {
    const spies = {
        sendVerificationCode: jest.fn(sendVerificationCode),
        resendVerificationCode: jest.fn(resendVerificationCode),
        verifyCodeAndDisable2FA: jest.fn(verifyCodeAndDisable2FA),
    };
    const logic = lost2FAStateMachine.provide({
        actors: {
            sendVerificationCode: fromPromise(({ input }) => spies.sendVerificationCode(input)),
            resendVerificationCode: fromPromise(() => spies.resendVerificationCode()),
            verifyCodeAndDisable2FA: fromPromise(({ input }) => spies.verifyCodeAndDisable2FA(input)),
        },
    });
    return { ...runFlow(logic, { [method]: true, ...recoveryMethods }), spies };
};

/** The code screen, once the code was sent (the phone code on request). */
const startOnCode = async (method: VerificationMethod, options: Parameters<typeof startCode>[1] = {}) => {
    const started = startCode(method, options);
    if (method === 'phone') {
        started.flow.send({ type: 'verification.codeRequested' });
    }
    await untilAt(started.flow, method, { awaitingCode: 'editing' });
    return started;
};

describe('lost-2FA navigation', () => {
    // Sending the email code waits forever, so the screens stay put
    const logic = lost2FAStateMachine.provide({
        actors: { sendVerificationCode: fromPromise(() => new Promise<VerificationResult>(() => {})) },
    });
    const screenOf = (flow: Flow) => selectLost2FAScreen(flow.getSnapshot());

    it('offers the methods in order, and goes back up them to the two-factor screen', () => {
        const { flow } = runFlow(logic, { email: true, phone: true, phrase: true }, true);
        const order = [
            'requestBackupCode',
            'verifyOwnershipWithEmail',
            'verifyOwnershipWithPhone',
            'verifyOwnershipWithPhrase',
            'noMethod',
        ];
        expect(screenOf(flow)).toBe(order[0]);
        for (const screen of order.slice(1)) {
            flow.send({ type: 'lost2FA.otherMethodRequested' });
            expect(screenOf(flow)).toBe(screen);
        }
        for (const screen of order.slice(0, -1).reverse()) {
            flow.send({ type: 'decision.back' });
            expect(screenOf(flow)).toBe(screen);
        }
        flow.send({ type: 'decision.back' });
        expect(flow.getSnapshot().output).toEqual({ outcome: 'return to 2fa step' });
    });

    it('skips the methods the account lacks, both ways', () => {
        const { flow } = runFlow(logic, { phone: true });
        expect(screenOf(flow)).toBe('verifyOwnershipWithPhone');
        flow.send({ type: 'lost2FA.otherMethodRequested' });
        expect(screenOf(flow)).toBe('noMethod');
        flow.send({ type: 'decision.back' });
        expect(screenOf(flow)).toBe('verifyOwnershipWithPhone');
        // The first screen: back returns to the two-factor screen
        flow.send({ type: 'decision.back' });
        expect(flow.getSnapshot().output).toEqual({ outcome: 'return to 2fa step' });
    });

    it('keeps the last screen up while the flow ends with a page change', () => {
        const { flow } = runFlow(logic, {});
        expect(screenOf(flow)).toBe('noMethod');
        flow.send({ type: 'lost2FA.passwordResetRequested' });
        expect(flow.getSnapshot().output).toEqual({ outcome: 'reset password' });
        expect(screenOf(flow)).toBe('noMethod');
    });
});

describe('lost-2FA code verification', () => {
    it('sends the email code right away, then waits for it', async () => {
        const { flow, spies } = startCode('email');
        expect(spies.sendVerificationCode).toHaveBeenCalledWith({ method: 'email' });
        await untilAt(flow, 'email', { awaitingCode: 'editing' });
        expect(flow.getSnapshot().context.verificationResults.email).toBe(verificationResult);
    });

    it('offers to send the email code again, three times, reporting each failure', async () => {
        const error = new Error('offline');
        const { flow, errors } = startCode('email', { sendVerificationCode: () => Promise.reject(error) });
        for (let attempt = 1; attempt <= 3; attempt++) {
            await untilAt(flow, 'email', 'sendingCodeFailed');
            expect(flow.getSnapshot().can({ type: 'verification.sendingCodeRetried' })).toBe(attempt < 3);
            flow.send({ type: 'verification.sendingCodeRetried' });
        }
        expect(isAt(flow, 'email', 'sendingCodeFailed')).toBe(true);
        expect(errors).toEqual([error, error, error]);
    });

    it('sends the phone code only once the user asks, and reports a failure', async () => {
        const error = new Error('offline');
        let fail = true;
        const { flow, spies, errors } = startCode('phone', {
            sendVerificationCode: () => (fail ? Promise.reject(error) : Promise.resolve(verificationResult)),
        });
        expect(isAt(flow, 'phone', 'readyToSend')).toBe(true);
        expect(spies.sendVerificationCode).not.toHaveBeenCalled();

        flow.send({ type: 'verification.codeRequested' });
        await untilAt(flow, 'phone', 'readyToSend');
        expect(errors).toEqual([error]);

        fail = false;
        flow.send({ type: 'verification.codeRequested' });
        await untilAt(flow, 'phone', { awaitingCode: 'editing' });
    });

    it('reuses a code sent before when coming back, without sending another', async () => {
        const { flow, spies } = await startOnCode('email', { recoveryMethods: { phone: true } });
        flow.send({ type: 'lost2FA.otherMethodRequested' });
        expect(flow.getSnapshot().matches('verifyOwnershipWithPhone')).toBe(true);
        flow.send({ type: 'decision.back' });
        expect(isAt(flow, 'email', { awaitingCode: 'editing' })).toBe(true);
        expect(spies.sendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it('disables two-factor authentication with the right code', async () => {
        const { flow, spies } = await startOnCode('phone');
        flow.send({ type: 'verification.codeSubmitted', code: '123456' });
        expect(flow.getSnapshot().hasTag('submitting')).toBe(true);
        await waitFor(flow, (snap) => snap.matches('twoFactorDisabled'));
        expect(spies.verifyCodeAndDisable2FA).toHaveBeenCalledWith({ method: 'phone', token: 'token', code: '123456' });
    });

    it('shows a wrong code inline, until the user edits it', async () => {
        const { flow, errors } = await startOnCode('email', {
            verifyCodeAndDisable2FA: () => Promise.reject(invalidCodeError),
        });
        flow.send({ type: 'verification.codeSubmitted', code: '000000' });
        await waitFor(flow, (snap) => snap.context.invalidCode);
        expect(isAt(flow, 'email', { awaitingCode: 'editing' })).toBe(true);
        expect(errors).toEqual([]);
        flow.send({ type: 'verification.codeEdited' });
        expect(flow.getSnapshot().context.invalidCode).toBe(false);
    });

    it('reports any other error and lets the user retry', async () => {
        const error = new Error('offline');
        const { flow, errors } = await startOnCode('email', { verifyCodeAndDisable2FA: () => Promise.reject(error) });
        flow.send({ type: 'verification.codeSubmitted', code: '123456' });
        await waitFor(flow, () => errors.length > 0);
        expect(isAt(flow, 'email', { awaitingCode: 'editing' })).toBe(true);
        expect(errors).toEqual([error]);
    });

    it('asks before sending a new code, then clears the old one', async () => {
        const { flow, spies } = await startOnCode('email', {
            verifyCodeAndDisable2FA: () => Promise.reject(invalidCodeError),
        });
        const emitted: string[] = [];
        flow.on('*', (event) => emitted.push(event.type));
        flow.send({ type: 'verification.codeSubmitted', code: '000000' });
        await waitFor(flow, (snap) => snap.context.invalidCode);

        flow.send({ type: 'verification.newCodeRequested' });
        expect(isAt(flow, 'email', { awaitingCode: 'newCodeDialog' })).toBe(true);
        expect(flow.getSnapshot().hasTag('newCodeDialog')).toBe(true);
        expect(flow.getSnapshot().hasTag('resending')).toBe(false);
        flow.send({ type: 'verification.newCodeDialogClosed' });
        expect(isAt(flow, 'email', { awaitingCode: 'editing' })).toBe(true);
        expect(spies.resendVerificationCode).not.toHaveBeenCalled();

        flow.send({ type: 'verification.newCodeRequested' });
        flow.send({ type: 'verification.resendRequested' });
        expect(isAt(flow, 'email', { awaitingCode: 'resending' })).toBe(true);
        // The code form reads the dialog from tags, whichever code screen it's on
        expect(flow.getSnapshot().hasTag('newCodeDialog')).toBe(true);
        expect(flow.getSnapshot().hasTag('resending')).toBe(true);
        await untilAt(flow, 'email', { awaitingCode: 'editing' });
        expect(flow.getSnapshot().context.invalidCode).toBe(false);
        expect(emitted).toEqual(['verification.codeResent']);
    });

    it('keeps the new code dialog open and reports it when sending fails', async () => {
        const error = new Error('offline');
        const { flow, errors } = await startOnCode('phone', { resendVerificationCode: () => Promise.reject(error) });
        flow.send({ type: 'verification.newCodeRequested' });
        flow.send({ type: 'verification.resendRequested' });
        await waitFor(flow, () => errors.length > 0);
        expect(isAt(flow, 'phone', { awaitingCode: 'newCodeDialog' })).toBe(true);
        expect(errors).toEqual([error]);
    });

    it('ignores back and another way while the code is checked', async () => {
        const check = deferred<void>();
        const { flow } = await startOnCode('email', {
            recoveryMethods: { phone: true },
            verifyCodeAndDisable2FA: () => check.promise,
        });
        flow.send({ type: 'verification.codeSubmitted', code: '123456' });
        // By then the server may have disabled two-factor authentication, which leaving would hide
        expect(flow.getSnapshot().can({ type: 'lost2FA.otherMethodRequested' })).toBe(false);
        expect(flow.getSnapshot().can({ type: 'decision.back' })).toBe(false);
        flow.send({ type: 'lost2FA.otherMethodRequested' });
        flow.send({ type: 'decision.back' });
        expect(isAt(flow, 'email', { awaitingCode: 'verifying' })).toBe(true);
        check.resolve();
        await waitFor(flow, (snap) => snap.matches('twoFactorDisabled'));
    });

    it('takes another way again when the check fails', async () => {
        const { flow } = await startOnCode('email', {
            verifyCodeAndDisable2FA: () => Promise.reject(invalidCodeError),
        });
        flow.send({ type: 'verification.codeSubmitted', code: '000000' });
        await waitFor(flow, (snap) => snap.context.invalidCode);
        expect(flow.getSnapshot().can({ type: 'lost2FA.otherMethodRequested' })).toBe(true);
    });

    it('starts each visit without the last rejected code', async () => {
        const { flow } = await startOnCode('email', {
            verifyCodeAndDisable2FA: () => Promise.reject(invalidCodeError),
            recoveryMethods: { phone: true },
        });
        flow.send({ type: 'verification.codeSubmitted', code: '000000' });
        await waitFor(flow, (snap) => snap.context.invalidCode);
        flow.send({ type: 'lost2FA.otherMethodRequested' });
        flow.send({ type: 'decision.back' });
        expect(isAt(flow, 'email', { awaitingCode: 'editing' })).toBe(true);
        expect(flow.getSnapshot().context.invalidCode).toBe(false);
    });
});

describe('lost-2FA phrase verification', () => {
    const startPhrase = (verifyPhraseAndDisable2FA: (input: { username: string; phrase: string }) => Promise<void>) => {
        const spy = jest.fn(verifyPhraseAndDisable2FA);
        const logic = lost2FAStateMachine.provide({
            actors: { verifyPhraseAndDisable2FA: fromPromise(({ input }) => spy(input)) },
        });
        return { ...runFlow(logic, { phrase: true }), spy };
    };

    it('disables two-factor authentication with the recovery phrase', async () => {
        const { flow, spy } = startPhrase(() => Promise.resolve());
        flow.send({ type: 'verification.phraseSubmitted', phrase: 'my phrase' });
        await waitFor(flow, (snap) => snap.matches('twoFactorDisabled'));
        expect(spy).toHaveBeenCalledWith({ username: 'member@example.com', phrase: 'my phrase' });
    });

    it('reports a failed check and lets the user retry', async () => {
        const error = new Error('wrong phrase');
        const { flow, errors } = startPhrase(() => Promise.reject(error));
        flow.send({ type: 'verification.phraseSubmitted', phrase: 'wrong' });
        await waitFor(flow, () => errors.length > 0);
        expect(flow.getSnapshot().matches({ verifyOwnershipWithPhrase: 'editing' })).toBe(true);
        expect(errors).toEqual([error]);
    });

    it('ignores another way while the phrase is checked', async () => {
        const check = deferred<void>();
        const { flow } = startPhrase(() => check.promise);
        flow.send({ type: 'verification.phraseSubmitted', phrase: 'my phrase' });
        expect(flow.getSnapshot().can({ type: 'lost2FA.otherMethodRequested' })).toBe(false);
        flow.send({ type: 'lost2FA.otherMethodRequested' });
        check.resolve();
        await waitFor(flow, (snap) => snap.matches('twoFactorDisabled'));
    });
});

/** The real verification requests, with an API that answers each URL as the test says. */
describe('createVerificationActors', () => {
    const DISABLE_2FA = 'core/v4/settings/2fa';

    const startWithApi = (answer: (config: { url: string }) => Promise<unknown>) => {
        const api = jest.fn(answer) as unknown as jest.Mock & Api;
        const called = (url: string) => api.mock.calls.some(([config]) => config.url === url);
        const logic = lost2FAStateMachine.provide({
            actors: {
                ...createVerificationActors({ api }),
                // Sending goes through a human verification challenge; these tests start from a sent code
                sendVerificationCode: fromPromise(() => Promise.resolve(verificationResult)),
            },
        });
        return { called, ...runFlow(logic, { email: true }) };
    };

    it('disables two-factor authentication once the code is verified', async () => {
        const { flow, called } = startWithApi(() => Promise.resolve({ Token: 'verified' }));
        await untilAt(flow, 'email', { awaitingCode: 'editing' });
        flow.send({ type: 'verification.codeSubmitted', code: '123456' });
        await waitFor(flow, (snap) => snap.matches('twoFactorDisabled'));
        expect(called(DISABLE_2FA)).toBe(true);
    });

    it('never disables two-factor authentication behind a screen the user left', async () => {
        const check = deferred<unknown>();
        const { flow, called } = startWithApi((config) =>
            config.url.startsWith('core/v4/verification/') ? check.promise : Promise.resolve({})
        );
        await untilAt(flow, 'email', { awaitingCode: 'editing' });
        flow.send({ type: 'verification.codeSubmitted', code: '123456' });
        // Leaving is refused while the check runs, so the screen shows what happened on the server
        flow.send({ type: 'lost2FA.otherMethodRequested' });
        flow.send({ type: 'decision.back' });
        check.resolve({ Token: 'verified' });
        await waitFor(flow, (snap) => snap.matches('twoFactorDisabled'));
        expect(called(DISABLE_2FA)).toBe(true);
    });
    const invalidToken = { data: { Code: API_CUSTOM_ERROR_CODES.TOKEN_INVALID, Error: 'Invalid code' } };

    it('shows a wrong code inline without disabling two-factor authentication', async () => {
        const { flow, called, errors } = startWithApi((config) =>
            config.url.startsWith('core/v4/verification/') ? Promise.reject(invalidToken) : Promise.resolve({})
        );
        await untilAt(flow, 'email', { awaitingCode: 'editing' });
        flow.send({ type: 'verification.codeSubmitted', code: '000000' });
        await waitFor(flow, (snap) => snap.context.invalidCode);
        expect(errors).toEqual([]);
        expect(called(DISABLE_2FA)).toBe(false);
    });

    it('reports an invalid token from disabling two-factor authentication, not as a wrong code', async () => {
        const { flow, errors } = startWithApi((config) =>
            config.url === DISABLE_2FA ? Promise.reject(invalidToken) : Promise.resolve({ Token: 'verified' })
        );
        await untilAt(flow, 'email', { awaitingCode: 'editing' });
        flow.send({ type: 'verification.codeSubmitted', code: '123456' });
        await waitFor(flow, () => errors.length > 0);
        expect(errors).toEqual([invalidToken]);
        expect(flow.getSnapshot().context.invalidCode).toBe(false);
    });
});
